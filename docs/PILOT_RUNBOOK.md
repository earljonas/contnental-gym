# Controlled pilot runbook

## Staging deployment

Use a separate hosted Supabase project and a separate HTTPS deployment of the Next.js server. Use the Node version in `.nvmrc`, `npm ci`, `npm run build`, and `npm run start`. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build and runtime. Set the staff Auth service key only at runtime in the host’s secret store. Keep `COACH_PROVIDER=off`. Never put the production project URL or service key in a pull request preview. Use fictional accounts and disable outbound mail outside the designated test recipients.

Apply the ordered migrations and confirm that the host’s Auth site URL and recovery allowlist point at the staging origin. Configure custom SMTP before testing real delivery. Enable email confirmation and use `{{ .Token }}` in the signup template. The local configuration captures email in Mailpit, so local signup sends no external email. [Supabase email and SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Provision staff by creating confirmed Auth accounts in the dashboard and assigning their roles in a trusted SQL session. Record who approved each role and its assigned branch. Before applying the hardening migration to an existing project, review the full role roster for unexpected accounts. Enable staff MFA in staging once Auth TOTP is enabled and the test administrators have access to authenticators.

```sql
update gym_private.security_settings set staff_mfa_required = true where singleton;
```

From the deployed URL, verify `/api/health` returns `200`, `/` and `/register` render, an anonymous `/dashboard` redirects to `/login`, and the disabled coach returns `404`. CI separately applies the migrations and validates the database rules with fictional fixtures. For staging, register with a test email, use the received code, and confirm the intended plan is pending. Sign in as each staff role. Confirm a cash registration and a GCash registration, save their receipts, and test lost-response retries. At two branches, check in the same eligible member twice, then test a pending and an expired member. Repeat once near the Manila date boundary. Cover camera denial, a real camera scan, keyboard-only activation, and a phone-width workout with a reload and save retry. Finally, compare the billing CSV against a known staging ledger and verify scheduled announcements against each branch’s session.

Set `STAGING_ORIGIN` in the repository’s GitHub Actions `staging` environment and run the **Staging smoke** workflow after deployment. For the local browser regression, run [the pilot harness](../scripts/verify-local-pilot.mjs) with a disposable Supabase stack. Supply the local API, Mailpit, and database URLs as `PILOT_API_URL`, `PILOT_MAIL_URL`, and `PILOT_DB_URL`, and the local keys as `PILOT_ANON_KEY` and `PILOT_SERVICE_KEY`. Set `PILOT_PLAYWRIGHT_MODULE` to the installed Playwright module specifier and optionally set `PILOT_CHROMIUM` and `PILOT_PSQL` to their executable paths. Use `PILOT_PRODUCTION=1` after building against the same local stack to test the production server.

The implementation treats plan duration as calendar days with an inclusive end date. It allows one visit per member per Manila day across all branches and one complete settlement per membership. Branch staff can collect for their home-branch members and unassigned registrations. Super admins can record a payment at a selected collection branch. Review these operating rules with the gym before the first real cohort.

## Reconcile old records before launch

Run these read-only queries as the database owner in a restored staging copy. Reconcile discrepancies against the receipt ledger and staff roster before correcting live data. Keep reconciliation evidence and approval with each correction.

```sql
select p.id, p.role, p.branch_id
from public.profiles p
where p.role in ('BRANCH_ADMIN', 'SUPER_ADMIN');

select m.id, m.status, count(p.id) filter (where p.status = 'CONFIRMED') as confirmed_receipts
from public.memberships m left join public.payments p on p.membership_id = m.id
group by m.id
having count(p.id) filter (where p.status = 'CONFIRMED') > 1
    or (m.status = 'ACTIVE' and count(p.id) filter (where p.status = 'CONFIRMED') = 0)
    or (m.status = 'PENDING' and count(p.id) filter (where p.status = 'CONFIRMED') > 0);

select user_id, (check_in_time at time zone 'Asia/Manila')::date as visit_day, count(*)
from public.attendance
group by user_id, visit_day having count(*) > 1;
```

## Monitoring and recovery

Configure the hosting platform to send failed `/api/health` probes and server log events to the pilot support owner. Start with an alert for three failed probes within five minutes, and review auth delivery failures and unexpected rejected check-ins each shift. Alert on `gym.settlement.failed`, repeated `gym.checkin.failed`, and `gym.workout.save_failed`. Retain route, event code, and the host’s request ID. Keep email addresses, payment references, authentication secrets, prompts, and replies out of the log sink.

Agree on a recovery point and recovery time with the gym. For example, a four-hour restore target and at most one business day of data loss require a daily backup, an offline receipt log, and a tested recovery process. Choose point-in-time recovery if the gym cannot tolerate a day of reconstructed activity. For each rehearsal, restore to a separate project, verify Auth and grants, reconcile the sample ledger, and time the restore. Keep one named decision-maker for switching the app to the restored project. Keep SMTP, environment variables, redirect settings, and storage configuration in the deployment inventory because database restore only covers database contents. [Supabase database backups](https://supabase.com/docs/guides/platform/backups) · [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project)

## Coach evaluation

Keep the coach disabled for the first operational pilot. For staging evaluation, set `COACH_PROVIDER` to `ollama`, `groq`, or `openai` and allow only fictional members in `COACH_MEMBER_IDS`. Groq uses `openai/gpt-oss-20b`, OpenAI uses `gpt-6-luna`, and Ollama defaults to `llama3.1`. Use dedicated project credentials for hosted testing. The shared budget is in millionths of one USD, so `100000` is $0.10. The server retains an upper-bound reservation if a provider fails to report usage. Compare that estimate with the provider’s billing dashboard.

Run the same questions on every candidate three times, with the same fictional workout history. Include beginner programming, exercise substitution, trends from set logs, a missing-history case, Cebuano prompts, pain during a set, and urgent symptoms. Run with and without the opt-in workout context. Score factual grounding, usefulness, language, and safety without revealing the provider to reviewers. Log first-token and completion time, usage, and whether a reply was interrupted. Test a disabled provider, upstream timeout, fragmented chunks, exhausted budget, and two simultaneous requests for one member. Confirm signup, payments, attendance, and workouts still work with the coach off. Proposed rollout gates are zero critical safety failures, at least 90% acceptable answers, p95 first token under two seconds, and at least 99% completed streams at the expected load.
