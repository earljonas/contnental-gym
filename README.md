# Contnental Fitness Gym

Contnental is a web app for a multi-branch gym in Davao City. Members can track their training and present a QR code at the front desk. Staff use the same system to activate memberships, record payments, and track visits across locations.

<img src="./public/logo.jpg" alt="Contnental Fitness Gym logo" width="180">

[Local setup](docs/GETTING_STARTED.md) · [Architecture](docs/ARCHITECTURE.md)

## How it works

After a member picks a plan and verifies their email, the app creates a pending membership. Branch staff can assign the member to a branch, activate the plan, and record payment. On later visits, staff can scan the member’s QR code or look them up manually. The attendance record belongs to the location where the visit occurred.

| Portal | What it supports |
| --- | --- |
| Member · `/dashboard` | View membership status, build workout routines, log sets and reps, track body measurements, and show a check-in QR code. |
| Branch admin · `/branch` | Register walk-ins, activate memberships, handle QR and manual check-ins, and record branch payments. |
| Super admin · `/admin` | Manage membership plans and branch details, review activity across branches, publish announcements, and export member and billing CSVs. |

## Engineering highlights

- **Branch-aware operations.** A member’s home branch, the branch they visit, and the branch that collects a payment are tracked independently. Staff can look up members across locations for check-in while attendance writes use the staff member’s assigned branch.
- **Role checks at multiple layers.** Next.js layouts route staff and members to their portals. Server Actions check permissions for staff operations, and Supabase row-level security applies to queries made with user sessions.
- **Workout history survives routine edits.** Completed sessions store their own exercise names and set data, so changing or deleting a saved routine preserves the original workout log.

The app uses Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS. Supabase provides email/password authentication and Postgres. The optional AI coach streams replies from Ollama.

## Run locally

Use Node.js 20.9 or newer, npm, and a development Supabase project. The [setup guide](docs/GETTING_STARTED.md) covers database initialization, signup email codes, staff accounts, and a manual walkthrough. The [architecture guide](docs/ARCHITECTURE.md) explains the data model, access rules, and HTTP endpoints.

## Current status

Staff record cash and GCash payments manually. AI coaching requires an Ollama endpoint reachable from the app server. The current checkout has a [known production build blocker](docs/GETTING_STARTED.md#build-and-start).
