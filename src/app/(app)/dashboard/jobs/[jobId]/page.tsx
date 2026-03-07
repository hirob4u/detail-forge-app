import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, customers } from "@/lib/db/schema";
import AnalysisStatusPanel from "./analysis-status-panel";
import StageControls from "./stage-controls";
import StageHistory from "./stage-history";
import type { JobStage } from "@/lib/db/schema";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const [job] = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      analysisStatus: jobs.analysisStatus,
      aiAssessment: jobs.aiAssessment,
      photos: jobs.photos,
      createdAt: jobs.createdAt,
      vehicleId: jobs.vehicleId,
      customerId: jobs.customerId,
      stageHistory: jobs.stageHistory,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    notFound();
  }

  const [vehicle] = await db
    .select({
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      color: vehicles.color,
    })
    .from(vehicles)
    .where(eq(vehicles.id, job.vehicleId))
    .limit(1);

  const [customer] = await db
    .select({
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.id, job.customerId))
    .limit(1);

  const stageBadgeColor: Record<string, string> = {
    created: "text-[var(--color-amber)] border-[var(--color-amber)]",
    quoted: "text-[var(--color-cyan)] border-[var(--color-cyan)]",
    sent: "text-[var(--color-purple-text)] border-[var(--color-purple-text)]",
    approved: "text-[var(--color-green)] border-[var(--color-green)]",
  };

  // Build retry payload from stored photos and vehicle info
  const photoKeys = (job.photos || []).map((p) => p.key);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Job Detail</h1>
        <span
          className={`inline-block rounded-[var(--radius-badge)] border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${stageBadgeColor[job.stage] || "text-[var(--color-muted)] border-[var(--color-border)]"}`}
          style={{ fontFamily: "var(--font-data)" }}
        >
          {job.stage}
        </span>
      </div>

      <div className="space-y-4">
        {/* Customer info */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Customer
          </p>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {customer.email} &middot; {customer.phone}
          </p>
        </div>

        {/* Vehicle info */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Vehicle
          </p>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{vehicle.color}</p>
        </div>

        {/* Created date */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Created
          </p>
          <p
            className="text-sm text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {job.createdAt.toLocaleDateString()}
          </p>
        </div>

        {/* Analysis status / action panel */}
        <AnalysisStatusPanel
          jobId={job.id}
          initialAnalysisStatus={job.analysisStatus}
          initialStage={job.stage}
          initialHasAssessment={job.aiAssessment !== null}
          retryPayload={{
            photoKeys,
            vehicleYear: vehicle.year,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            vehicleColor: vehicle.color,
          }}
        />

        {/* QC link -- visible when job is in qc stage */}
        {job.stage === "qc" && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-purple-action)]/40 bg-[var(--color-elevated)] p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                This job is ready for QC
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Complete the checklist and upload after photos before marking
                this job complete.
              </p>
            </div>
            <Link
              href={`/dashboard/jobs/${jobId}/qc`}
              className="shrink-0 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)]"
            >
              Open QC
            </Link>
          </div>
        )}

        {/* Stage controls */}
        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Stage
          </h2>
          <StageControls jobId={job.id} currentStage={job.stage as JobStage} />
        </section>

        {/* Stage history */}
        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            History
          </h2>
          <StageHistory history={job.stageHistory ?? []} />
        </section>
      </div>
    </div>
  );
}
