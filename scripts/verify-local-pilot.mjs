import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const { PILOT_API_URL, PILOT_MAIL_URL, PILOT_DB_URL, PILOT_ANON_KEY, PILOT_SERVICE_KEY,
  PILOT_PSQL = "psql", PILOT_PLAYWRIGHT_MODULE, PILOT_CHROMIUM } = process.env;
const app = "http://127.0.0.1:3308";
for (const value of [PILOT_API_URL, PILOT_MAIL_URL, PILOT_DB_URL]) {
  assert.ok(value && ["localhost", "127.0.0.1"].includes(new URL(value).hostname), "Use only a disposable loopback stack");
}
assert.ok(PILOT_ANON_KEY && PILOT_SERVICE_KEY && PILOT_PLAYWRIGHT_MODULE);
const { chromium } = await import(PILOT_PLAYWRIGHT_MODULE);
const anon = () => createClient(PILOT_API_URL, PILOT_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(PILOT_API_URL, PILOT_SERVICE_KEY, { auth: { persistSession: false } });
const stamp = randomUUID().slice(0, 8);
const password = `Gym-audit!${randomUUID()}`;
const memberEmail = `member-${stamp}@example.com`;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function expectOk(result, operation) {
  assert.ok(!result.error, `${operation} failed (${result.error?.code ?? "unknown"})`);
  return result.data;
}

function queryDatabase(sql) {
  return execFileSync(PILOT_PSQL, ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-d", PILOT_DB_URL], {
    input: sql, encoding: "utf8", windowsHide: true,
  }).trim();
}

async function staff(role, branch, label) {
  const email = `${label}-${stamp}@example.com`;
  const { user } = expectOk(await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { first_name: "Fictional", last_name: label },
  }), "Create staff fixture");
  assert.match(user.id, /^[a-f\d-]{36}$/i);
  queryDatabase(`update public.profiles set role = '${role}', branch_id = ${branch ?? "null"} where id = '${user.id}';`);
  const client = anon();
  expectOk(await client.auth.signInWithPassword({ email, password }), `Sign in ${label}`);
  return { email, client };
}

async function signIn(page, email, route) {
  await page.goto(`${app}/login`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "SIGN IN", exact: true }).click();
  await page.waitForURL(`${app}${route}`);
}

async function signupCode() {
  for (let attempt = 0; attempt < 25; attempt++) {
    const response = await fetch(`${PILOT_MAIL_URL}/view/latest.html?query=${encodeURIComponent(`to:${memberEmail}`)}`);
    if (response.ok) {
      const code = (await response.text()).match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }
    await wait(400);
  }
  throw new Error("No signup code arrived in Mailpit");
}

const mode = process.env.PILOT_PRODUCTION === "1" ? ["start"] : ["dev", "--webpack"];
const appServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...mode, "--hostname", "127.0.0.1", "--port", "3308"], {
  windowsHide: true,
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: PILOT_API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: PILOT_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: PILOT_SERVICE_KEY, COACH_PROVIDER: "off", NEXT_TELEMETRY_DISABLED: "1" },
});
let browser;
try {
  let health;
  for (let attempt = 0; attempt < 45; attempt++) {
    health = await fetch(`${app}/api/health`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
    if (health?.ok) break;
    await wait(400);
  }
  assert.equal(health?.status, 200);
  assert.equal((await fetch(`${app}/api/coach`, { method: "POST" })).status, 404);
  browser = await chromium.launch({ executablePath: PILOT_CHROMIUM, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(30_000);

  await page.goto(`${app}/register`);
  await page.locator("#firstName").fill("Fictional");
  await page.locator("#lastName").fill(`Member ${stamp}`);
  await page.locator("#email").fill(memberEmail);
  await page.locator("#phone").fill("09000000000");
  await page.locator("#password").fill(password);
  await page.locator("#confirmPw").fill(password);
  await page.getByRole("button", { name: "CONTINUE", exact: true }).click();
  await page.getByRole("button", { name: /^1 Month/i }).click();
  await page.getByRole("button", { name: "CONTINUE", exact: true }).click();
  const code = await signupCode();
  for (const [index, digit] of [...code].entries()) await page.locator(`#otp-${index}`).fill(digit);
  await page.getByRole("button", { name: "VERIFY", exact: true }).click();
  await page.getByRole("heading", { name: "YOU'RE IN" }).waitFor();
  const member = anon();
  const { user } = expectOk(await member.auth.signInWithPassword({ email: memberEmail, password }), "Sign in as member");
  const pending = expectOk(await member.from("memberships").select("id,status").single(), "Read pending enrollment");
  assert.equal(pending.status, "PENDING");
  console.log("Browser signup, Mailpit OTP, pending enrollment, and member Auth passed");

  const branchA = await staff("BRANCH_ADMIN", 1, "branch-a");
  const branchB = await staff("BRANCH_ADMIN", 2, "branch-b");
  const owner = await staff("SUPER_ADMIN", null, "owner");
  const cashier = await browser.newPage({ viewport: { width: 390, height: 844 } });
  cashier.setDefaultTimeout(30_000);
  await signIn(cashier, branchA.email, "/branch");
  await cashier.getByLabel("Find a pending member").fill(stamp);
  await cashier.getByRole("button", { name: "Activate", exact: true }).click();
  const sheet = cashier.getByRole("dialog", { name: "Activate membership" });
  await sheet.waitFor();
  assert.equal(await sheet.evaluate((node) => node.contains(document.activeElement)), true);
  await sheet.getByRole("button", { name: "Record payment and activate" }).click();
  await cashier.getByRole("status").filter({ hasText: "Receipt #" }).waitFor();
  assert.equal(expectOk(await member.from("memberships").select("status").single(), "Read activated membership").status, "ACTIVE");

  const results = await Promise.all([branchA.client, branchB.client].map((client) =>
    client.rpc("record_gym_visit", { target_member: user.id, visit_method: "Manual" })));
  assert.deepEqual(results.map((result) => expectOk(result, "Check in concurrently")).sort(), ["DUPLICATE", "RECORDED"]);
  await cashier.goto(`${app}/branch/attendance`);
  await cashier.getByLabel("Find a member").fill(stamp);
  await cashier.getByRole("button", { name: `Fictional Member ${stamp}` }).click();
  await cashier.getByRole("button", { name: "Check in", exact: true }).click();
  await cashier.getByText("Already checked in today", { exact: true }).waitFor();
  console.log("Branch login, mobile activation, cash receipt, cross-branch concurrency, and manual duplicate feedback passed");

  const walkInEmail = `walkin-${stamp}@example.com`;
  const gcashReference = `AUDIT-${stamp}`;
  await cashier.goto(`${app}/branch/members`);
  await cashier.getByRole("button", { name: "Register Member", exact: true }).click();
  await cashier.locator("#walkin-first-name").fill("Fictional");
  await cashier.locator("#walkin-last-name").fill(`Walk-in ${stamp}`);
  await cashier.locator("#walkin-email").fill(walkInEmail);
  await cashier.locator("#walkin-phone").fill("09000000001");
  await cashier.locator("#walkin-method").selectOption("GCASH");
  await cashier.locator("#walkin-reference").fill(gcashReference);
  await cashier.locator("#walkin-password").fill(password);
  await cashier.getByRole("button", { name: "Review Registration", exact: true }).click();
  await cashier.getByRole("button", { name: "Create and Activate", exact: true }).click();
  await cashier.waitForURL((url) => url.pathname === "/branch/members" && url.searchParams.has("memberId"));
  const walkIn = anon();
  const walkInSession = expectOk(await walkIn.auth.signInWithPassword({ email: walkInEmail, password }), "Walk-in login");
  const gcash = expectOk(await walkIn.from("payments").select("id, status, payment_method, reference_number, amount").single(), "Walk-in payment");
  assert.equal(gcash.status, "CONFIRMED");
  assert.equal(gcash.payment_method, "GCASH");
  assert.equal(gcash.reference_number, gcashReference);
  const retry = expectOk(await branchA.client.rpc("settle_membership", {
    target_member: walkInSession.user.id, method: "GCASH", reference: gcashReference,
  }), "Walk-in settlement retry");
  assert.equal(retry, gcash.id);
  console.log("Walk-in account creation, login, GCash settlement, and retry passed");

  const superPage = await browser.newPage();
  superPage.setDefaultTimeout(30_000);
  await signIn(superPage, owner.email, "/admin");
  await superPage.goto(`${app}/admin/billing`);
  const downloadPending = superPage.waitForEvent("download");
  await superPage.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPending;
  const csv = readFileSync(await download.path(), "utf8");
  assert.ok(csv.includes(`Fictional Walk-in ${stamp}`) && csv.includes(`Fictional Member ${stamp}`));
  console.log("Super-admin browser login, billing, and CSV reconciliation passed");

  const workout = await browser.newPage({ viewport: { width: 390, height: 844 } });
  workout.setDefaultTimeout(30_000);
  await signIn(workout, memberEmail, "/dashboard");
  await workout.goto(`${app}/dashboard/session`);
  await workout.getByRole("checkbox", { name: "Start a rest timer after logging a set" }).uncheck();
  await workout.getByRole("spinbutton", { name: "Set 1 weight in kilograms" }).fill("25");
  await workout.getByRole("button", { name: "Log set 1" }).click();
  await workout.getByText("Logged", { exact: true }).waitFor();
  await workout.reload();
  await workout.getByText("Logged", { exact: true }).waitFor();
  await workout.getByRole("button", { name: "Finish", exact: true }).click();
  await workout.getByRole("button", { name: "Save session", exact: true }).click();
  await workout.getByRole("button", { name: "Done", exact: true }).waitFor();
  const sessions = expectOk(await member.from("workout_sessions").select("id,exercises"), "Read workout history");
  assert.ok(sessions.length === 1 && sessions[0].exercises[0].sets[0].weight === 25);
  console.log("Member browser login, mobile draft restoration, workout save, and history passed");
} finally {
  await browser?.close();
  if (appServer.pid && process.platform === "win32") {
    try { execFileSync("taskkill.exe", ["/pid", String(appServer.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" }); } catch { appServer.kill(); }
  } else { appServer.kill(); }
}
