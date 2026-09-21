# Security Plan Manager

A multi-tenant NIST CSF 2.0 workspace for assessing brands, tracking Current vs Target posture, attaching evidence, managing software inventory, and publishing frozen board scorecards.

Security Plan Manager is built for CISOs, assessors, control owners, auditors, and board viewers who need a shared organizational profile rather than a static spreadsheet.

## Features

### Program and brands

- Create an organization and one or more brands, each with a period profile (for example `2026-Q3`).
- The menu shows brands under **Program**. Assessment, evidence, reports, publish, and software inventory sit under each brand.

### NIST CSF 2.0 scoring

- Catalog is the CSF 2.0 Core: 6 functions, 22 categories, and 106 subcategories.
- Brand dashboards show overall Current and Target (0–100, derived from CSF Tiers), coverage, evidence counts, and function cards.
- Inline Current and Target tier editors on the organizational profile, with an optional comment when a value changes.
- Click an outcome to open a details panel with the abbreviation, full function/category/outcome text, profile inclusion, rationale, Current/Target fields, and edit history.

### Highest brand risks

- Live dashboards “Largest gaps” with **Highest brand risks**.
- NIST CSF Current vs Target gaps are ranked first.
- Unresolved installed-app CVEs appear only when CVSS is above 7.5 (only from a BOD highest risk standpoint), grouped by product so one application cannot fill the list (at most two CVE slots).

### Software inventory and CVEs

- Per-brand inventory of applications (product, company, version, category, notes).
- Active products are matched against a rolling 120-day CVE catalog by product name.
- Export a CSV template of the active list, edit it outside the app, and re-import: new rows are added, rows that keep their `id` are updated, and removed rows are archived.
- Login alerts surface outstanding matches between application in use and CVE's, this also happens if you add an application that has a recent CVE.
- Dashboard and report insight cards count unique **application + CVE date**, so one product with many same-day CVEs is one exposure, not hundreds. The actual CVE details are still visible within the application showing all the vulnerabilities.

### Evidence and history

- Evidence locker holds URLs, notes, and file attachments linked to subcategory assessments.
- History records Current and Target changes with who made them and any comment.

### Board reports

- Live Current vs Target scores on brand dashboards. Publish a dated snapshot as a frozen checkpoint.
- Reports are brand-specific and linked under each brand in the menu. Opening a snapshot shows the scorecard as of publish time.
- Published scorecards include a plain-language explanation of each NIST function (Govern, Identify, Protect, Detect, Respond, Recover) for board readers.
- Snapshots freeze **Highest brand risks** and software/CVE insight counts. 

### People

- Roster with role changes, deactivate, and reactivate.
- Invite by email with a shareable link (SMTP is optional on Config). Only owners can assign the owner role.

### Roles and access

- Per-organization roles with **None / View / Edit** for Program, Assessment, Evidence, History, Reports, People, Roles, Config, and Software inventory. Edit includes View.
- Brand access is defined on the role (all brands or selected brands), not on each person.
- Add custom roles, optionally copying permissions and brand access from an existing role.

### Config

- Deployment-wide SMTP, CVE catalog retention, CVE sync interval, and invite expiry. Not brand-specific. Opened from the hamburger after Roles.

### Accounts

- Email/password sign-in and sign-up.
- New accounts create an organization, first brand, and a full CSF 2.0 profile for the current period.
- Demo tenant is seeded with scored assessments, evidence, software inventory, and published board snapshots.

## Stack

Next.js App Router, Auth.js (credentials JWT), Prisma, and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`. Set `CVE_SYNC_SECRET` before exposing the CVE sync HTTP endpoint. Demo accounts and the demo tenant seed are on by default in development; set `DEMO_LOGIN=0` or run in production to hide them.
2. Start Postgres. Prefer Docker (`docker compose up -d`). If Docker is not installed, run a workspace-local cluster with `npm run db:start`.
3. Push schema and seed the CSF catalog:

```
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed loads 6 functions, 22 categories, and 106 subcategories, then a demo tenant with scored assessments, evidence, and published board snapshots.

4. Run the app: `npm run dev`

Optional CVE jobs. The GitHub `cvelistV5` delta is also pulled on the first `/app` visit after the Config sync interval (default 24 hours). For a clocked pull while the app is running:

```
npm run cve:cron
```

That process syncs immediately, then every X hours from Config. One-off: `npm run cve:sync`. The same cron also refreshes CVE.org published-record metrics if they are more than a week old.

An external crontab or host scheduler can POST to `/api/cron/cve-sync` with `Authorization: Bearer $CVE_SYNC_SECRET`. That run is forced unless you pass `?force=0`. The published-records table has a matching `/api/cron/cve-metrics` endpoint.

## Demo login

Shown on `/login` in development, or when `DEMO_LOGIN=1`. Do not seed or expose these accounts on a public host.

| Role | Email | Password |
| --- | --- | --- |
| CISO | `ciso@apex.example` | `ChangeMe123!` |
| Assessor | `analyst@apex.example` | `ChangeMe123!` |
| Board viewer | `board@apex.example` | `ChangeMe123!` |

Apex Retail is a published 2026-Q3 profile for dashboards, software inventory, and board reports. Apex Wholesale is a lower-coverage draft.

## First use

You can also create a new account, then an organization and brand. That generates a period profile with every CSF 2.0 subcategory. Assess Current vs Target tiers, attach evidence, record software, and publish a frozen board snapshot.

## Screenshots

### Sign in

![Sign in with demo accounts](docs/screenshots/01-login.png)

### Program

Brand list with Current, Target, and coverage, plus creating another brand.

![Cybersecurity program home](docs/screenshots/02-program.png)

### Brand dashboard

Live CISO view of NIST CSF 2.0 functions, highest brand risks, and software/CVE insights.

![Apex Retail brand dashboard](docs/screenshots/03-brand-dashboard.png)

Dashboard cont.
<img width="1185" height="819" alt="image" src="https://github.com/user-attachments/assets/5d508a22-18b8-4b99-a832-af783bcfcf94" />
<img width="1190" height="413" alt="image" src="https://github.com/user-attachments/assets/7d92f83e-98b2-4f51-8f99-9c10c7cb23cd" />
<img width="1185" height="764" alt="image" src="https://github.com/user-attachments/assets/27df0eff-4d5c-47c1-bc82-c4c0d07aba2d" />


### Navigation

Hamburger menu with each brand’s assessment, evidence, reports, publish, and software inventory links.

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

### Brand reports

Published checkpoints for one brand.

![Apex Retail reports](docs/screenshots/09-reports.png)

### Board scorecard

Frozen function scores, NIST function explanations, and highest brand risks or largest gaps.

![Board scorecard](docs/screenshots/10-board-scorecard.png)

### Software inventory

Active applications, category filter, collapsed add form, and CSV import/export. Archived items stay hidden until you choose View archived.

![Software inventory](docs/screenshots/13-software-inventory.png)

### People

Change roles, deactivate people, and invite teammates. Brand access comes from the role.

![People roster and invites](docs/screenshots/11-people.png)

### Roles

Add or delete roles, set View/Edit by product area, and choose which brands the role can open.

![Role permissions and brand access](docs/screenshots/12-roles.png)

### Use and Intent

This is intended to run inside a brand network, not really focused on an internet deployment. It should also not be considered a finished product. This is a work in progress which likely has bugs that I will continue to work through. Though the basic functionality seems to test and work as designed. Hope you gain something from this project, even if it's just a starting point for your project.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
