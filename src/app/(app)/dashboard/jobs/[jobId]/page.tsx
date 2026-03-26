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
import AiBriefingCard from "./_components/ai-briefing-card";
import type { AiBriefing } from "@/lib/types/ai";
import PhotoViewer from "./_components/photo-viewer";
import PackagePricingCard from "./_components/package-pricing-card";
import CustomerCard from "./_components/customer-card";
import AIConditionNotesCard from "./_components/ai-condition-notes-card";
import CustomerNotesCard from "./_components/customer-notes-card";
import CollapsibleSection from "@/app/(app)/_components/collapsible-section";
import StageBadge from "@/app/(app)/_components/stage-badge";
import type { JobStage } from "@/lib/db/schema";
import type { ConditionAssessment } from "@/lib/types/assessment";
import { normalizeFlags } from "@/lib/normalize-flags";

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
      detailerNotes: jobs.detailerNotes,
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

  // ---------------------------------------------------------------------------
  // Prepare AI assessment data for display
  // ---------------------------------------------------------------------------

  const rawAssessment = job.aiAssessment as Record<string, unknown> | null;
  let parsedAssessment: ConditionAssessment | null = null;

  if (rawAssessment && typeof rawAssessment === "object") {
    parsedAssessment = {
      ...rawAssessment,
      flags: normalizeFlags(rawAssessment.flags),
    } as ConditionAssessment;
  }

  // Derive a reasoning string from the top score descriptions
  let aiReasoning: string | null = null;
  if (parsedAssessment) {
    const descriptions = Object.values(parsedAssessment.scores)
      .filter((s) => s.description)
      .map((s) => s.description);
    // Use the first 2 descriptions as a summary if there are multiple
    if (descriptions.length > 0) {
      aiReasoning = descriptions.slice(0, 2).join(" ");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ── Header: job ID + vehicle + stage + actions ──────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[11px] tracking-[0.04em] text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {job.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            {vehicle.year} {vehicle.make} {vehicle.model}
            <span className="text-[var(--color-muted)]"> &mdash; {vehicle.color}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={job.stage} analysisStatus={job.analysisStatus ?? ""} />
          <Link
            href={`/dashboard/jobs/${jobId}/review`}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          >
            Edit job
          </Link>
        </div>
      </div>

      {/* ── Pipeline progress indicator ────────────────────────────── */}
      <StagePipeline currentStage={job.stage as JobStage} />

      <div className="mt-6 space-y-4">
        {/* ── Two-column grid: Package + Customer ────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <PackagePricingCard
            jobId={job.id}
            stage={job.stage}
            finalQuote={job.finalQuote}
            aiAssessment={parsedAssessment}
            analysisStatus={job.analysisStatus ?? ""}
          />
          <CustomerCard
            customer={customer}
            createdAt={job.createdAt}
            intents={(job.intents ?? []) as string[]}
          />
        </div>

        {/* ── Customer notes (read-only, from intake) ──────────────── */}
        <CustomerNotesCard notes={job.notes ?? ""} />

        {/* ── AI Briefing — shown when analysis is complete and briefing exists */}
        {(() => {
          if (job.analysisStatus !== "complete" || !job.aiAssessment) return null;
          const assessment = job.aiAssessment as Record<string, unknown>;
          const briefing = assessment.briefing as AiBriefing | undefined;
          if (!briefing?.summary) return null;
          return <AiBriefingCard briefing={briefing} />;
        })()}

        {/* ── Photo viewer — always available ─────────────────────── */}
        <PhotoViewer
          jobId={job.id}
          initialPhotoCount={((job.photos ?? []) as unknown[]).length}
          hasNewPhotos={job.hasNewPhotos}
          customerEmail={customer.email ?? null}
          photoRequestSentAt={job.photoRequestSentAt?.toISOString() ?? null}
        />

        {/* ── Detailer notes (editable scratchpad) ─────────────────── */}
        <JobNotes jobId={job.id} initialNotes={job.detailerNotes ?? ""} />

        {/* ── AI condition highlights — slim bar, links to full ─────── */}
        {parsedAssessment && (
          <AIConditionNotesCard
            jobId={job.id}
            flags={parsedAssessment.flags}
            reasoning={aiReasoning}
          />
        )}

        {/* ── Analysis status — only shows processing/failed now ──── */}
        <AnalysisStatusPanel
          jobId={job.id}
          initialAnalysisStatus={job.analysisStatus}
          initialStage={job.stage}
          initialHasAssessment={job.aiAssessment !== null}
          initialRetryCount={job.analysisRetryCount}
          initialUpdatedAt={job.updatedAt.toISOString()}
          photoCount={(job.photos ?? []).length}
        />

        {/* ── QC link — visible when job is in qc stage ──────────── */}
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

        {/* ── Stage controls ──────────────────────────────────────── */}
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

        {/* ── Social export — only for completed jobs ─────────────── */}
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

        {/* ── Stage history — collapsed by default ────────────────── */}
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
