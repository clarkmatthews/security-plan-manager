# Security Plan Manager

A multi-tenant NIST CSF 2.0 workspace for assessing brands, tracking Current vs Target posture, attaching evidence, and publishing board scorecards.

Security Plan Manager is built for CSOs, assessors, control owners, auditors, and board viewers who need a shared organizational profile rather than a static spreadsheet.

## Features

### Program and brands
- Create an organization and one or more brands, each with a period profile (for example `2026-Q3`).
- Program home shows Current, Target, and coverage for every brand you can access.
- Hamburger navigation on the left; **Sign out** stays on the top right.
- Program submenu links go straight to a brand (for example Apex Retail or Apex Wholesale).

### NIST CSF 2.0 scoring
- Catalog is the CSF 2.0 Core: 6 functions, 22 categories, and 106 subcategories.
- Brand dashboards show overall Current and Target (0–100, derived from CSF Tiers), coverage, evidence counts, and function cards with full names plus abbreviations (Govern (GV), Identify (ID), and so on).
- Inline Current and Target tier editors on the organizational profile, with an optional comment when a value changes.
- Click an outcome to open a details panel with the abbreviation, full function/category/outcome text, profile inclusion, rationale, Current/Target fields, and edit history.

### Evidence and history
- Evidence locker holds URLs, notes, and file attachments linked to subcategory assessments.
- History records Current and Target changes with who made them and any comment.

### Board reports
- Live Current vs Target scores on brand dashboards and board scorecards.
- Publish a dated snapshot as a checkpoint. Reports lists those snapshots; opening one shows the scorecard and largest gaps.

### People
- Roster with role changes, deactivate, and reactivate.
- Deactivated people cannot sign in or complete onboarding.
- Invite by email with a shareable link. Only owners can assign the owner role.
- The last active organization owner cannot be removed or deactivated.

### Roles and access
- Per-organization roles with **None / View / Edit** (radio) for Program, Assessment, Evidence, History, Reports, People, and Roles. Edit includes View.
- Brand access is defined on the role (all brands or selected brands), not on each person.
- Add custom roles, optionally copying permissions and brand access from an existing role.
- You cannot delete a role while people are assigned or invites are still open. The organization owner role is locked and cannot be deleted.
- Navigation and pages follow those permissions. Brand pages return not found when the role cannot open that brand.

### Accounts
- Email/password sign-in and sign-up.
- New accounts create an organization, first brand, and a full CSF 2.0 profile for the current period.
- Demo tenant is seeded with scored assessments, evidence, and a published board snapshot.

## Stack

Next.js App Router, Auth.js (credentials JWT), Prisma, and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
2. Start Postgres. Prefer Docker (`docker compose up -d`). If Docker is not installed, run a workspace-local cluster with `npm run db:start`.
3. Push schema and seed the CSF catalog:

```
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed loads 6 functions, 22 categories, and 106 subcategories, then a demo tenant with scored assessments, evidence, and a published board snapshot.

4. Run the app: `npm run dev`

## Demo login

| Role | Email | Password |
| --- | --- | --- |
| CSO | `cso@apex.example` | `ChangeMe123!` |
| Assessor | `analyst@apex.example` | `ChangeMe123!` |
| Board viewer | `board@apex.example` | `ChangeMe123!` |

Apex Retail is a published 2026-Q3 profile for dashboards and board reports. Apex Wholesale is a lower-coverage draft.

## First use

You can also create a new account, then an organization and brand. That generates a period profile with every CSF 2.0 subcategory. Assess Current vs Target tiers, attach evidence, and publish a frozen board snapshot.

## Screenshots

### Sign in

![Sign in with demo accounts](docs/screenshots/01-login.png)

### Program

Brand list with Current, Target, and coverage, plus creating another brand.

![Cybersecurity program home](docs/screenshots/02-program.png)

### Brand dashboard

Live CSO view of NIST CSF 2.0 functions with full names and abbreviations.

![Apex Retail brand dashboard](docs/screenshots/03-brand-dashboard.png)

### Navigation

Hamburger menu with Program brand links, Reports, People, and Roles.

![Hamburger navigation](docs/screenshots/04-navigation.png)

### Organizational profile

Inline Current and Target scoring for CSF 2.0 outcomes.

![Organizational profile assessment](docs/screenshots/05-assessment.png)

### Outcome details

Click an outcome for the full text, inclusion, Current/Target fields, and edit history.

![Outcome details panel](docs/screenshots/06-outcome-details.png)

### Assessment history

Current and Target changes with comments.

![Assessment history](docs/screenshots/07-history.png)

### Evidence locker

Files, URLs, and notes linked to subcategory assessments.

![Evidence locker](docs/screenshots/08-evidence.png)

### Board reports

Published checkpoints for board viewers.

![Board reports list](docs/screenshots/09-reports.png)

### Board scorecard

Live function scores and largest gaps.

![Board scorecard](docs/screenshots/10-board-scorecard.png)

### People

Change roles, deactivate people, and invite teammates. Brand access comes from the role.

![People roster and invites](docs/screenshots/11-people.png)

### Roles

Add or delete roles, set View/Edit by product area, and choose which brands the role can open.

![Role permissions and brand access](docs/screenshots/12-roles.png)
