# Getting started

[Project overview](../README.md) · [Architecture](ARCHITECTURE.md)

## Prerequisites

- The Node.js LTS version pinned in [`.nvmrc`](../.nvmrc) and its bundled npm.
- A dedicated development Supabase project with access to its SQL Editor, Auth settings, and Data API. Use test accounts and fictional member records.
- A test inbox for signup email codes. To scan a QR code, use a camera-enabled browser on localhost or HTTPS and allow camera access. [Browser camera requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security)

## Install and configure

From the repository root, install the versions in the npm lockfile.

```bash
npm ci
```

Copy [`.env.example`](../.env.example) to `.env.local` and fill in the values for your development project. On Windows, use `Copy-Item .env.example .env.local` in PowerShell.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The project’s publishable key or legacy `anon` key. Keep the variable name as written. |
| `SUPABASE_SERVICE_ROLE_KEY` | The project’s backend secret key or legacy `service_role` key. Used for walk-in Auth provisioning and optional coach metering. Keep it server-side. |
| `OLLAMA_URL` | Optional. Defaults to `http://localhost:11434` from the Next.js server’s point of view. |
| `OLLAMA_MODEL` | Optional. Defaults to `llama3.1`. |

Find the URL in your project’s connection settings and the keys under **Settings → API Keys**. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## Initialize the database

Use the [ordered migrations](../supabase/migrations) for a fresh Supabase project. The first migration is a baseline from the legacy schema, feature patches, and explicit grants. The later migrations enforce enrollment and payment state, visit eligibility, workout saves, provider budgets, and optional staff MFA.

For local Supabase, run the pinned CLI from the repository root with Docker running.

```bash
npx --yes supabase@3.4.0 start
npx --yes supabase@3.4.0 db reset
```

Use Supabase CLI with a disposable project or apply the migration SQL in order using the staging project’s SQL editor. On an existing database installed from the legacy scripts, verify the schema and grants already match the baseline before marking version `20261126000100` applied. Apply later migrations in order to a restored copy first. Review existing roles, visit duplicates and ambiguous receipts using the [pilot runbook](PILOT_RUNBOOK.md). The hardening migration preserves historical rows for reconciliation.

The local configuration enables email confirmation and exposes Mailpit. Use the CLI status output to find the local API and mail inbox addresses. The PostgreSQL CI job applies the full sequence and checks role isolation and mutations with fictional users. Use an actual Supabase stack when verifying email and JWT behavior.

### Signup and staff accounts

1. Enable the email provider and email confirmation in Supabase Auth. Edit **Confirm sign up** to include `{{ .Token }}` so the message contains the six-digit code the registration form expects. Set the Auth Site URL to `http://localhost:3000` for local development. [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. For the member flow, use `/register` once the dev server is running. Select a plan and enter the emailed code. The app creates the pending membership after verification and advances only after that write succeeds. Check for that record before continuing to activation.
3. For staff, create two confirmed test users with passwords in Supabase Auth. Copy their user IDs and run the following in the SQL Editor. Replace both UUID placeholders and choose an existing branch ID from the first query.

```sql
select id, name from public.branches order by id;

update public.profiles
set role = 'BRANCH_ADMIN', branch_id = 1
where id = '<branch-admin-user-uuid>' and role = 'MEMBER';

update public.profiles
set role = 'SUPER_ADMIN', branch_id = null
where id = '<super-admin-user-uuid>' and role = 'MEMBER';
```

The role trigger mirrors those updates to `public.user_roles`. The repository’s historical admin seed targets existing accounts. Use your own test users for this setup.

## Start the dev server

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) for the public site and [the login page](http://localhost:3000/login) for the portals. Use a separate browser profile or sign out between roles.

### Optional AI coach

Install Ollama, start its server if needed, and pull the default model.

```bash
ollama serve
```

```bash
ollama pull llama3.1
```

Run the second command in a separate terminal if `ollama serve` is running in the foreground. Set `COACH_PROVIDER=ollama` and allow fictional members with `COACH_MEMBER_IDS`. Set `OLLAMA_URL` and `OLLAMA_MODEL` if you use another endpoint or model, and restart Next.js. If a member opts in, the model server receives the workout context described in the [architecture guide](ARCHITECTURE.md#ai-coach). [Ollama model page](https://ollama.com/library/llama3.1)

## Verify the main workflows

Run `npm run lint` and `npm run typecheck` for static checks. [CI](../.github/workflows/ci.yml) also builds the production bundle and smoke-tests public routes and the anonymous dashboard redirect with placeholder Supabase settings. Use the manual checks below with your development accounts.

| Check | Expected result |
| --- | --- |
| Sign in with each test role. | The member, branch admin, and super admin land at `/dashboard`, `/branch`, and `/admin`, respectively. |
| Complete member signup and activate the plan as branch staff. | The pending membership appears in the branch workflow. Activation assigns the member to the branch, marks the plan active, and records a staff-entered payment. |
| Check the member in manually or scan their QR code. Repeat the check-in on the same day. | The visit appears in the branch attendance list. The second check-in is rejected. |
| Save a routine, finish a workout, and log a body measurement. | The workout appears in the member’s history and the measurement appears on the progress page. |
| Publish an announcement as super admin. | It appears in the intended app feeds after the publish time. |

If signup completes without a pending membership, verify the seeded plans and the authenticated role’s access to `membership_plans` and `memberships`. If the scanner cannot start, check camera permission and use the manual check-in option to verify attendance.

## Build and start

```bash
npm run build
npm run start
```

`npm run start` serves the output of the production build. Barlow Condensed and DM Sans are bundled with the app and served locally. See the [font licenses and sources](../app/fonts/README.md).

Deployment requires a Next.js server runtime for session handling, Server Actions, and the streaming coach endpoint. Configure the Supabase URL, keys, and Auth Site URL for the target environment. Review account-role provisioning and database permissions before enabling public registration. Keep the coach disabled for the first operational pilot. See the [pilot runbook](PILOT_RUNBOOK.md) for staging, monitoring, restore drills, and coach evaluation.
