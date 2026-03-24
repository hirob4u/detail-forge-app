import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, customers, organizations } from "@/lib/db/schema";
import AnalysisStatusPanel from "./analysis-status-panel";
import StageControls from "./stage-controls";
import StageHistory from "./stage-history";
import StagePipeline from "./stage-pipeline";
import SocialExportPanel from "./_components/social-export-panel";
import JobNotes from "./_components/job-notes";
import PhotoViewer from "./_components/photo-viewer";
import CollapsibleSection from "@/app/(app)/_components/collapsible-section";
import StageBadge from "@/app/(app)/_components/stage-badge";
import type { JobStage } from "@/lib/db/schema";
import { formatPhone } from "@/lib/format";

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
      orgId: jobs.orgId,
      notes: jobs.notes,
      finalQuote: jobs.finalQuote,
      quoteSentAt: jobs.quoteSentAt,
      qcPhotos: jobs.qcPhotos,
      stageHistory: jobs.stageHistory,
      analysisRetryCount: jobs.analysisRetryCount,
      intents: jobs.intents,
      hasNewPhotos: jobs.hasNewPhotos,
      photoRequestSentAt: jobs.photoRequestSentAt,
      updatedAt: jobs.updatedAt,
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

  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      plateBlockingEnabled: organizations.plateBlockingEnabled,
      watermarkEnabled: organizations.watermarkEnabled,
    })
    .from(organizations)
    .where(eq(organizations.id, job.orgId))
    .limit(1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Job Detail</h1>
        <StageBadge stage={job.stage} analysisStatus={job.analysisStatus ?? ""} />
      </div>

      {/* Pipeline progress indicator */}
      <StagePipeline currentStage={job.stage as JobStage} />

      <div className="mt-6 space-y-4">
        {/* Compact metadata — customer + vehicle + created in one card */}
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {customer.firstName}{customer.lastName ? ` ${customer.lastName}` : ""}
            <span className="font-normal text-[var(--color-muted)]">
              {customer.phone ? <> &middot; {formatPhone(customer.phone)}</> : null}
            </span>
          </p>
          <p className="text-sm text-[var(--color-text)]">
            {vehicle.year} {vehicle.make} {vehicle.model}
            <span className="text-[var(--color-muted)]"> &mdash; {vehicle.color}</span>
          </p>
          {/* Customer intents */}
          {(() => {
            const intents = (job.intents ?? []) as string[];
            if (intents.length === 0) return null;
            const labels: Record<string, string> = {
              wash: "Wash & basic clean",
              interior: "Deep interior clean",
              paint: "Scratch or paint issues",
              protection: "Long-term protection",
              unsure: "Wants recommendation",
            };
            return (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {intents.map((intent) => (
                  <span
                    key={intent}
                    className="rounded-[var(--radius-badge)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {labels[intent] ?? intent}
                  </span>
                ))}
              </div>
            );
          })()}
          <p
            className="mt-1 text-xs text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Created {job.createdAt.toLocaleDateString()}
          </p>
        </div>

        {/* Photo viewer — always available, independent of AI analysis */}
        <PhotoViewer
          jobId={job.id}
          initialPhotoCount={((job.photos ?? []) as unknown[]).length}
          hasNewPhotos={job.hasNewPhotos}
          customerEmail={customer.email ?? null}
          photoRequestSentAt={job.photoRequestSentAt?.toISOString() ?? null}
        />

        {/* Persistent notes */}
        <JobNotes jobId={job.id} initialNotes={job.notes ?? ""} />

        {/* Analysis status / action panel */}
        <AnalysisStatusPanel
          jobId={job.id}
          initialAnalysisStatus={job.analysisStatus}
          initialStage={job.stage}
          initialHasAssessment={job.aiAssessment !== null}
          initialRetryCount={job.analysisRetryCount}
          initialUpdatedAt={job.updatedAt.toISOString()}
          photoCount={(job.photos ?? []).length}
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
          <StageControls
            jobId={job.id}
            currentStage={job.stage as JobStage}
            customerEmail={customer.email ?? undefined}
            quoteTotal={job.finalQuote?.totalPrice}
            quoteSentAt={job.quoteSentAt}
          />
        </section>

        {/* Social export -- only for completed jobs */}
        {job.stage === "complete" && org && (
          <SocialExportPanel
            jobId={job.id}
            afterPhotos={job.qcPhotos ?? []}
            plateBlockingEnabled={org.plateBlockingEnabled}
            watermarkEnabled={org.watermarkEnabled}
            hasLogo={!!org.logoUrl}
            shopName={org.shopName ?? org.name}
          />
        )}

        {/* Stage history — collapsed by default */}
        <CollapsibleSection
          title="History"
          count={(job.stageHistory ?? []).length}
          defaultOpen={false}
        >
          <StageHistory history={job.stageHistory ?? []} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
