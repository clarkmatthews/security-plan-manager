# Software and CVEs

Each brand has a **software inventory**: applications that brand actually uses.

## Inventory

For each application you record product name, company, version, category, and notes. Categories include Security, AI, Business application, Infrastructure, Developer tool, Collaboration, and Other.

**Active** applications are matched against the CVE catalog. **Archived** applications stay in history but are not matched going forward. Use archive when something is retired rather than deleting the trail.

## CSV import and export

You can export the active list as a CSV, edit it outside the product, and import it again.

- Keep the **id** column to update an existing row.
- New rows without an id are added.
- Rows that disappear from the file are **archived** (not hard-deleted).

## How CVE matching works

The product keeps a rolling catalog of CVE records (default **120 days**; Config can change this). After each sync, and when you add or restore an application, it looks for the **product name** in CVE summaries and product text.

Matches that are still open can appear:

- In a **login alert** if you can view Software inventory. You can acknowledge one or all, or snooze the dialog for this browser session.
- On **CVE history** for the brand (application matches vs the full ingested catalog). Search by CVE ID or description. Entries with no description are hidden by default. Rejected CVEs are dropped from the catalog and are not matched, alerted, or shown on the dashboard.
- In **Highest brand risks** only when CVSS is above 7.5, the app is still active, and the match is not acknowledged. At most two CVE slots, grouped by product.

## Software and CVE insight cards

On the brand dashboard, outstanding and resolved CVE counts are unique **application + CVE date**. Ten CVEs on the same product on the same day count as one exposure, not ten.

## Published CVE records (CVE.org)

The bottom of the live dashboard also shows the CVE.org **Published CVE Records** table: quarterly counts for the whole CVE List, not this brand. The table is copied about once a week. Incomplete quarters show as TBA. The charts are percent change: quarter over quarter for completed quarters, and year over year for years that already have all four quarters. People with Config **Edit** can also press **Sync Published CVE Records Now** on Config to copy a fresh table immediately.

Board snapshots do not freeze this widget.

## Keeping the catalog fresh

CVE records arrive from a public GitHub CVE feed. The first visit to the app after the Config **sync interval** (default 24 hours) can pull new items. Operators can also run a scheduled job. Config sets how many days to keep records; older ones are dropped on the next sync.

You can load an older published-date range from CVE history if you have Software edit. That range cannot be longer than the retention window.
