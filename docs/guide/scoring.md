# How scores work

Scores answer two questions: how mature are we **today**, and how mature did we **aim** to be?

They are **not** “106 of 106 outcomes complete.” The catalog has 106 NIST CSF 2.0 outcomes. The numbers you see on dashboards are **0–100 maturity**, built from CSF Tiers.

## Tiers

Each outcome can have a **Current** tier and a **Target** tier:

| Tier | Meaning in practice | Score |
| --- | --- | --- |
| Partial | Ad hoc, inconsistent | 25 |
| Risk Informed | Guided by risk, still uneven | 50 |
| Repeatable | Defined and consistently performed | 75 |
| Adaptive | Reviewed and improved with the business | 100 |

The conversion is simple: the product treats Partial as 1, Adaptive as 4, then `(tier ÷ 4) × 100`.

## Function scores

NIST CSF 2.0 groups outcomes into six functions: **Govern, Identify, Protect, Detect, Respond, Recover**.

For each function:

- **Current** is the average of the 0–100 scores for outcomes that are in the profile and have a Current tier.
- **Target** is the same idea using Target tiers.

Outcomes marked as not included in the profile are left out. Unchecking **Included in organizational profile** saves immediately and updates the live dashboard. Existing board snapshots stay frozen until someone publishes again.

The dashboard **Excluded** tile is how many outcomes are out of the profile. Click it to open the catalog already filtered to those rows. The catalog and the six function cards both default to **All**, with **Included** and **Excluded** filters.

The **% complete** in the top right of a function card is the **Current** score, not the Target. Under the title you still see “current of target” (for example 50 of 75) and how many outcomes in that function are in the profile.

## Overall Current and Target

Overall Current is the **unweighted average of the six function Current scores** (only functions that have at least one scored outcome). Overall Target is the same with Target scores.

That means Govern is not weighted more than Recover. A 100 overall means every included, scored function is at Adaptive — not that every one of the 106 outcomes has a note.

## Coverage

**Coverage = Current ÷ Target**, shown as a percent.

Example: Overall Current 40 and Overall Target 80 → Coverage **50%**. You are halfway to the maturity you set as the target.

If Target is 100 and Current is 100, Coverage is 100%. Coverage can never explain “how many outcomes are filled in.” That is a different idea.

## Evidence count

The Evidence tile counts artifacts (files, URLs, or notes) linked to **in-scope** outcomes for that brand. Evidence on excluded outcomes is not included. It is a volume indicator, not a quality score.

## Highest brand risks

The live dashboard lists up to five **Highest brand risks**:

1. CSF gaps first: Target tier minus Current tier for in-scope outcomes. Larger gaps rank higher. Ties prefer a Partial current, then higher priority.
2. Remaining slots can be unresolved software CVEs with CVSS above 7.5. At most two CVE slots, grouped by product, so one application cannot fill the list.

Published reports freeze this list at publish time.
