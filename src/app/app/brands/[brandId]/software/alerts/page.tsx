import { redirect } from "next/navigation";

export default async function SoftwareAlertHistoryRedirect({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  redirect(`/app/brands/${brandId}/software/cves`);
}
