import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingForm } from "@/components/onboarding-form";
import { getActiveMembership, isDeactivatedUser } from "@/lib/membership";
import { organizationExists } from "@/lib/signup-policy";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (await getActiveMembership(session.user.id)) {
    redirect("/app");
  }
  if (await isDeactivatedUser(session.user.id)) {
    redirect("/login?error=deactivated");
  }
  if (await organizationExists()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Invite required</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This deployment already has an organization. Open the invite link from an
          owner to join. You cannot create another organization from here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Set up your organization</h1>
      <p className="mt-2 mb-8 text-sm text-[var(--muted)]">
        This creates your tenant, first brand, and a NIST CSF 2.0 profile.
      </p>
      <OnboardingForm />
    </div>
  );
}
