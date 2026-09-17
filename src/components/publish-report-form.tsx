"use client";

import { publishReportAction } from "@/actions/report";
import { PeriodFields } from "@/components/period-fields";
import { SubmitButton } from "@/components/submit-button";
import { currentPeriod } from "@/lib/scoring";

export function PublishReportForm({
  profileId,
  period,
}: {
  profileId: string;
  period?: string | null;
}) {
  return (
    <form action={publishReportAction.bind(null, profileId)} className="space-y-3">
      <PeriodFields period={period || currentPeriod()} idPrefix="publish-" />
      <SubmitButton>Publish board snapshot</SubmitButton>
    </form>
  );
}
