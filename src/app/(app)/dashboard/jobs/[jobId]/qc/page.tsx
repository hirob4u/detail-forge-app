import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import QcForm from "./qc-form";

export default async function QcPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/sign-in");

  const orgId = await getDetailForgeOrgId(
    session.session.activeOrganizationId,
  );
  if (!orgId) redirect("/dashboard");

  const [job] = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      orgId: jobs.orgId,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) notFound();

  // QC screen is only accessible when job is in qc stage
  if (job.stage !== "qc") {
    redirect(`/dashboard/jobs/${jobId}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Quality Control
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Review your work against the original assessment before marking
          this job complete.
        </p>
      </div>
      <QcForm jobId={jobId} />
    </div>
  );
}
