"use client";

import { useTransition } from "react";
import { acknowledgeBrandCveMatchAction } from "@/actions/cve-alerts";
import { Button } from "@/components/ui";

export function AcknowledgeMatchButton({
  brandId,
  matchId,
}: {
  brandId: string;
  matchId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await acknowledgeBrandCveMatchAction(brandId, matchId);
        })
      }
    >
      {pending ? "Saving…" : "Acknowledge"}
    </Button>
  );
}
