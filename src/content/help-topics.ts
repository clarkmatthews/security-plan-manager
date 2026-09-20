export const HELP_TOPICS = {
  program: {
    title: "Cybersecurity program",
    paragraphs: [
      "This is the list of brands you can open. Each brand is one program you score against NIST CSF 2.0.",
      "Current and Target are 0–100 maturity scores. Coverage is Current divided by Target — how far you are toward the target, not how many of the 106 outcomes are filled in.",
    ],
  },
  brandDashboard: {
    title: "Brand dashboard",
    paragraphs: [
      "This is the live CISO view. Scores, priorities, risks, and software insights update when the organizational profile, priority list, or inventory changes.",
      "Published board reports are separate frozen copies. They do not change when this dashboard does.",
    ],
  },
  overallCurrent: {
    title: "Overall current",
    paragraphs: [
      "How mature the brand is today, on a 0–100 scale derived from CSF Tiers (Partial 25, Risk Informed 50, Repeatable 75, Adaptive 100).",
      "It is the unweighted average of the six function Current scores. 100 means Adaptive maturity, not “106 of 106 outcomes.”",
    ],
  },
  overallTarget: {
    title: "Overall target",
    paragraphs: [
      "The maturity you aimed for, using the same 0–100 tier scale as Current.",
      "The gap under the number is Target minus Current.",
    ],
  },
  coverage: {
    title: "Coverage",
    paragraphs: [
      "Coverage is Current divided by Target, shown as a percent toward the target.",
      "Example: Current 40 and Target 80 is 50% coverage. It does not mean half of the 106 outcomes are complete.",
    ],
  },
  evidenceCount: {
    title: "Evidence",
    paragraphs: [
      "This counts files, URLs, and notes linked to outcomes that are included in the organizational profile.",
      "It is a volume indicator, not a quality score. Open Evidence under the brand to browse items.",
    ],
  },
  excludedCount: {
    title: "Excluded",
    paragraphs: [
      "How many of the 106 NIST CSF outcomes are not in this brand’s organizational profile.",
      "Those outcomes do not count toward Overall, Coverage, function scores, or in-scope evidence. On the live dashboard, click the number to open the catalog filtered to excluded rows. Published board reports freeze this count.",
    ],
  },
  functionComplete: {
    title: "Function scores",
    paragraphs: [
      "Each card is one NIST function (Govern, Identify, Protect, Detect, Respond, Recover). Scores use only outcomes included in the profile.",
      "The percent in the top right is the Current score, not the Target. Filter All, Included, or Excluded to hide functions that still have in-scope outcomes or that have none. Click a card to open that function in the organizational profile, if you can view assessments.",
    ],
  },
  priorities: {
    title: "Priorities",
    paragraphs: [
      "A manual, ordered list of NIST CSF outcomes that leadership wants to see making progress. It is not the Low/Medium/High field on each assessment.",
      "People with Program Edit can add outcomes from the 106-item catalog, reorder them, or remove them. Published board snapshots freeze this list and the Current → Target tiers at publish time.",
    ],
  },
  highestBrandRisks: {
    title: "Highest brand risks",
    paragraphs: [
      "Up to five items. NIST CSF gaps (Target tier minus Current) are listed first.",
      "Unresolved CVEs on active software appear only when CVSS is above 7.5, and at most two slots, grouped by product so one application cannot fill the list.",
    ],
  },
  softwareInsights: {
    title: "Software and CVE insights",
    paragraphs: [
      "Applications is the active inventory count for this brand.",
      "Outstanding and resolved CVE counts are unique application plus CVE date. Many CVEs on the same product on the same day count as one exposure.",
    ],
  },
  assessment: {
    title: "Organizational profile",
    paragraphs: [
      "Score each NIST CSF 2.0 outcome’s Current and Target tiers. There are 106 outcomes across six functions.",
      "Uncheck Included in organizational profile to drop that outcome from live dashboard and the next published board snapshot. The checkbox saves immediately. Filter the list by All, Included, or Excluded.",
    ],
  },
  assessmentTiers: {
    title: "Current and Target tiers",
    paragraphs: [
      "Current is today’s maturity. Target is where you want it. Tiers map to 25, 50, 75, and 100.",
      "The first time a Current or Target is set, history records “Initial Configuration Set” and no comment is asked. Later changes ask for an optional comment, which still shows in Assessment history if you leave it blank.",
    ],
  },
  history: {
    title: "Assessment history",
    paragraphs: [
      "A log of Current and Target changes: when, who, which outcome, old value, new value, and any comment.",
      "This page is read-only. Scores themselves are edited on the organizational profile.",
    ],
  },
  evidence: {
    title: "Evidence locker",
    paragraphs: [
      "Evidence is always tied to a specific outcome: a file, a URL, or notes.",
      "Attach items from the outcome details panel. This locker lists everything for the brand.",
    ],
  },
  software: {
    title: "Software inventory",
    paragraphs: [
      "Applications this brand uses. Active products are matched to CVEs by product name. Archived items stay in history but are not matched.",
      "Export a CSV, edit it outside the app, and re-import. Keep the id column to update a row. Missing rows are archived.",
    ],
  },
  cveHistory: {
    title: "CVE history",
    paragraphs: [
      "Application matches are CVEs tied to this brand’s software. All ingested CVEs is the shared catalog for the deployment. Search by CVE ID or description. Records without a description are hidden unless you choose to show them.",
      "Rejected CVEs are not ingested or shown. How long records stay and how often the feed syncs is set on Config (defaults 120 days and 24 hours). Acknowledge a match when you have handled it.",
    ],
  },
  reports: {
    title: "Brand reports",
    paragraphs: [
      "Each snapshot is a frozen copy of the brand dashboard at publish time: scores, priorities, risks, and software insights.",
      "Edits after publish change the live dashboard only. Board readers should open a snapshot, not the working profile.",
    ],
  },
  publish: {
    title: "Publish board snapshot",
    paragraphs: [
      "Publishing freezes Current, Target, Coverage, function scores, priorities, highest brand risks, and software insights for the period you choose.",
      "Use this when leadership needs a checkpoint that will not move as assessors keep scoring.",
    ],
  },
  boardScorecard: {
    title: "Board scorecard",
    paragraphs: [
      "This is the frozen snapshot. Numbers, priorities, and risks here do not change when the live dashboard does.",
      "Function cards include a short NIST explanation for board readers.",
    ],
  },
  people: {
    title: "People",
    paragraphs: [
      "Everyone in this organization and their role. Brand access comes from the role, not from this list.",
      "Invites always create a copyable link. If Config has SMTP filled in, the invite is emailed too. Only owners can invite another owner.",
    ],
  },
  roles: {
    title: "Roles",
    paragraphs: [
      "Each role has None, View, or Edit for every product area. Edit includes View.",
      "Brand access is also on the role: all brands or only the ones you select. Everyone with that role gets the same brands.",
    ],
  },
  rolesMatrix: {
    title: "View and Edit",
    paragraphs: [
      "None hides the area. View lets people see lists and details. Edit lets them create, change, or delete.",
      "Config and Roles are sensitive. Assessors and board viewers start with no access there unless you grant it.",
    ],
  },
  brandAccess: {
    title: "Brand access",
    paragraphs: [
      "Choose all brands or only selected brands for this role.",
      "This applies to every person with the role. You do not assign brands on the People page.",
    ],
  },
  config: {
    title: "Config",
    paragraphs: [
      "These settings apply to the whole deployment, not one brand: email (SMTP), CVE retention, CVE sync interval, and invite expiry.",
      "Access is granted on the Roles page. Secrets such as the database password stay outside this screen.",
    ],
  },
  configSmtp: {
    title: "Email",
    paragraphs: [
      "Optional SMTP for invite and test messages. Leave the password blank to keep the stored value.",
      "Invites always show a copyable link. Mail is sent only when host and from address are saved.",
    ],
  },
  configCveInvites: {
    title: "CVE and invites",
    paragraphs: [
      "Retention is how many days CVE records stay (default 120). Older records are pruned on the next sync.",
      "Sync interval is the minimum hours between GitHub delta pulls (default 24). Invite expiry is how long a new invite link lasts (default 14 days).",
    ],
  },
} as const;

export type HelpTopicId = keyof typeof HELP_TOPICS;
