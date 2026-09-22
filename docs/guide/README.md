# Security Plan Manager guide

This folder explains how the product works in everyday language. It is for operators, CISOs, and board readers. You do not need to know how the software is built.

## What it is

Security Plan Manager is a shared workspace for scoring a **brand** against the NIST Cybersecurity Framework (CSF) 2.0. Teams record how mature each outcome is today (**Current**) and how mature it should be (**Target**), attach evidence, list the software in use, and publish a frozen board scorecard.

It is not a spreadsheet. Everyone with access sees the same live scores. A published report does not change when someone later edits the working profile.

## Who uses it

| Role | Typical job in this product |
| --- | --- |
| Organization owner | Sets up the organization, invites people, and can assign the owner role |
| CISO | Sees the full program: scores, risks, software, people, and roles. Config is for the platform admin |
| Assessor / control owner | Scores outcomes, attaches evidence, and maintains software inventory |
| Auditor | Reads assessments, evidence, history, and reports |
| Board / executive viewer | Reads published reports only |

Your organization can rename or add roles. Access is **View** or **Edit** for each area of the product, plus which brands that role can open.

## How the menu is organized

After you sign in, the hamburger menu lists:

1. **Program** — your brands. Under each brand: assessment, evidence, reports, publish, and software inventory.
2. **People** — who is in the organization.
3. **Roles** — what each role can see and change, and which brands they can open.
4. **Config** — deployment-wide email and CVE settings for the platform admin. Not tied to one brand, and not granted from Roles.

You only see items your role allows. Board viewers usually see **Reports** instead of Program.

## Chapters

1. [Getting around](getting-around.md) — accounts, organizations, brands, and roles
2. [How scores work](scoring.md) — Current, Target, Coverage, and the 0–100 scale
3. [Organizational profile](assessment.md) — scoring outcomes and the details panel
4. [Evidence](evidence.md) — files, links, and notes
5. [Software and CVEs](software-and-cves.md) — inventory, matching, alerts, and risks
6. [Reports](reports.md) — live dashboard vs published snapshots
7. [People, Roles, and Config](people-roles-config.md) — access, invites, and system settings

In the app, click the **?** next to a heading or widget for a short version of the same explanation.
