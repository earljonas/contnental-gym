# Getting started

[Project overview](../README.md) · [Architecture](ARCHITECTURE.md)

## Prerequisites

- Node.js 20.9 or newer and npm.
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
| `SUPABASE_SERVICE_ROLE_KEY` | The project’s backend secret key or legacy `service_role` key. Used for walk-in registration, staff completion of existing registrations, and the optional duplicate-email check during signup. Keep it server-side. |
| `OLLAMA_URL` | Optional. Defaults to `http://localhost:11434` from the Next.js server’s point of view. |
| `OLLAMA_MODEL` | Optional. Defaults to `llama3.1`. |

Find the URL in your project’s connection settings and the keys under **Settings → API Keys**. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

## Initialize the database

In an empty development Supabase project, run each file once in the SQL Editor, in the order shown. Start with the base schema and apply the role-routing patch before the feature patches that use its role helpers.

| Order | SQL file | Purpose |
| --- | --- | --- |
| 1 | [`schema.sql`](../supabase/schema.sql) | Base tables, policies, branch and plan data, and signup trigger. |
| 2 | [`patch-fix-role-routing.sql`](../supabase/patch-fix-role-routing.sql) | Role lookup table, profile-to-role synchronization, and policy helpers. |
| 3 | [`patch-branch-admin-walkups.sql`](../supabase/patch-branch-admin-walkups.sql) | Branch staff access to pending online registrations. |
| 4 | [`patch-fix-branch-activation-rls.sql`](../supabase/patch-fix-branch-activation-rls.sql) | Activation policies and repair for certain incomplete activations. |
| 5 | [`patch-all-branch-member-access.sql`](../supabase/patch-all-branch-member-access.sql) | Cross-branch check-in lookup and staff profile editing. |
| 6 | [`patch-collection-branch-billing.sql`](../supabase/patch-collection-branch-billing.sql) | Payment collection-branch field, backfill, and policies. |
| 7 | [`patch-membership-plan-labels.sql`](../supabase/patch-membership-plan-labels.sql) | Plan data used by the signup flow. |
| 8 | [`patch-workout-sessions.sql`](../supabase/patch-workout-sessions.sql) | Routines, routine exercises, and completed workout sessions. |
| 9 | [`patch-body-metrics.sql`](../supabase/patch-body-metrics.sql) | Member body measurement logs. |
| 10 | [`patch-announcements.sql`](../supabase/patch-announcements.sql) | Announcements and feed policies. |
| 11 | [`patch-walk-in-registration-support.sql`](../supabase/patch-walk-in-registration-support.sql) | Indexes used by member, plan, payment, and attendance lookups. |

The base schema and role-routing patch cover the fresh-install changes from the older email, recursion, and role-isolation patches. For a database that already has project data, identify which patches are installed before making schema changes. The base schema and several policy definitions are intended to run once.

The sequence and grants below were checked on an empty PostgreSQL 15 instance using stand-ins for Supabase’s `auth.users` and `auth.uid()`. The check covered schema creation, seed plans, role synchronization, basic member writes, and branch activation, payment, and attendance writes. Supabase Auth, email delivery, and HTTP Data API behavior require their own checks.

### Data API grants

On Supabase projects with explicit Data API grants, run the following after the schema is installed. These grants cover the app’s authenticated reads and writes, plus the backend operations used in staff registration. Row-level security still governs access for authenticated users. [Supabase Data API permissions](https://supabase.com/docs/guides/api/securing-your-api)

```sql
grant usage on schema public to authenticated, service_role;

grant select on public.branches, public.profiles, public.user_roles,
  public.membership_plans, public.memberships, public.payments, public.attendance,
  public.routines, public.routine_exercises, public.workout_sessions,
  public.body_metrics, public.announcements to authenticated;

grant insert on public.membership_plans, public.memberships, public.payments,
  public.attendance, public.routines, public.routine_exercises,
  public.workout_sessions, public.body_metrics, public.announcements to authenticated;
grant update on public.branches, public.membership_plans, public.memberships,
  public.payments, public.routines to authenticated;
grant update (first_name, last_name, phone, avatar_url, branch_id, updated_at)
  on public.profiles to authenticated;
grant delete on public.routines, public.routine_exercises, public.body_metrics,
  public.announcements to authenticated;
grant usage on sequence public.membership_plans_id_seq, public.memberships_id_seq,
  public.payments_id_seq, public.attendance_id_seq, public.routines_id_seq,
  public.routine_exercises_id_seq, public.workout_sessions_id_seq,
  public.body_metrics_id_seq, public.announcements_id_seq to authenticated;
grant execute on function public.is_super_admin(), public.is_branch_admin(),
  public.is_admin(), public.my_branch_id(),
  public.branch_admin_can_manage_member(uuid),
  public.branch_admin_update_member_profile(uuid, text, text, text) to authenticated;

grant select, insert, update on public.profiles to service_role;
grant select, insert, delete on public.memberships to service_role;
grant insert on public.payments to service_role;
grant usage on sequence public.memberships_id_seq, public.payments_id_seq to service_role;
```

### Signup and staff accounts

1. Enable the email provider and email confirmation in Supabase Auth. Edit **Confirm sign up** to include `{{ .Token }}` so the message contains the six-digit code the registration form expects. Set the Auth Site URL to `http://localhost:3000` for local development. [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. For the member flow, use `/register` once the dev server is running. Select a plan and enter the emailed code. The app attempts to create a pending membership after verification. Check for that record before continuing to activation.
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

Run the second command in a separate terminal if `ollama serve` is running in the foreground. Set `OLLAMA_URL` and `OLLAMA_MODEL` in `.env.local` if you use another endpoint or model, then restart Next.js. The model server receives the member context described in the [architecture guide](ARCHITECTURE.md#ai-coach). [Ollama model page](https://ollama.com/library/llama3.1)

## Verify the main workflows

Run `npm run lint` for static lint checks. The repository has no automated test command. Use these manual checks with your development accounts.

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

`npm run start` requires a successful build. In the current checkout, the leftover [`/instruments` route](../app/instruments/page.tsx) imports a missing Supabase module and blocks the build. The build also needs access to Google Fonts for the two typefaces loaded through `next/font/google`.

Deployment requires a Next.js server runtime for session handling, Server Actions, and the streaming coach endpoint. Configure the Supabase URL, keys, and Auth Site URL for the target environment. Review account-role provisioning and database permissions before enabling public registration. A hosted coach requires an Ollama endpoint reachable from the deployment.
