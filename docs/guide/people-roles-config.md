# People, Roles, and Config

These three items sit at the end of the hamburger. They are organization-wide, not brand-specific. Config is last.

## People

The roster lists everyone in the organization: name, email, role, and whether they are active.

People with People **Edit** can change roles, deactivate, and reactivate. Deactivated people cannot work in the app until someone turns them back on.

**Invites:** choose an email and a role. A link is always created so you can copy it. If Config has SMTP host and from address filled in, the product also emails the link. Invite lifetime comes from Config (default 14 days). Only owners can invite another owner.

## Roles

Each role has **None / View / Edit** for every product area:

- Program, Assessment, Evidence, History, Reports, People, Roles, Config, Software inventory.

**Edit includes View.** View means see lists and details. Edit means create, change, or delete in that area.

**Brand access** is on the role: all brands, or only the brands you tick. Everyone with that role gets the same brand list. You do not set brands person-by-person.

You can add a custom role and optionally copy another role’s permissions. You cannot delete a role while someone is assigned to it or has an open invite. The organization owner role cannot be deleted.

## Config

Config is for the **whole deployment**, not one brand. Typical editors are owners and CISOs.

- **Email (SMTP)** — host, port, encryption, username, password, from name, from address. Password is write-only (leave blank to keep the stored value). Invites still work as copyable links if mail is not set up. You can send a test message to yourself after saving.
- **CVE retention (days)** — how long CVE records stay in the catalog (default 120).
- **CVE sync interval (hours)** — minimum time between automatic GitHub delta pulls (default 24).
- **Published CVE records** — **Sync Published CVE Records Now** copies CVE.org’s quarterly counts onto the live dashboard immediately. The same table also refreshes about once a week.
- **Invite expiry (days)** — how long a new invite link stays valid (default 14).

Secrets such as the database password and login signing key stay outside this page.

## Glossary

| Term | Meaning |
| --- | --- |
| Organization | The tenant: people, roles, Config |
| Brand | One program you score |
| Outcome | One of 106 NIST CSF 2.0 subcategories |
| Tier | Partial, Risk Informed, Repeatable, or Adaptive |
| Current | How mature the outcome is today |
| Target | How mature you want it to be |
| Coverage | Current ÷ Target, as a percent toward the target |
| Snapshot | A published, frozen board scorecard |
| Evidence | A file, URL, or note linked to an outcome |
