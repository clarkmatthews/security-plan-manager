"use client";

import { logoutAction } from "@/actions/auth";
import { CVE_ALERT_SNOOZE_KEY } from "@/lib/cve-constants";
import { Button } from "@/components/ui";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        sessionStorage.removeItem(CVE_ALERT_SNOOZE_KEY);
        sessionStorage.removeItem("cve-alert-snoozed");
        await logoutAction();
      }}
    >
      <Button type="submit" variant="ghost">
        Sign out
      </Button>
    </form>
  );
}
