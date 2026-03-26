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
import PrimaryActionBanner from "./_components/primary-action-banner";
import CollapsibleSection from "@/app/(app)/_components/collapsible-section";
import StageBadge from "@/app/(app)/_components/stage-badge";
import type { JobStage } from "@/lib/db/schema";
import type { ConditionAssessment } from "@/lib/types/assessment";
import { normalizeFlags } from "@/lib/normalize-flags";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StageHistoryEntry {
  from: string;
  to: string;
  at: string;
  note?: string;
}

function getDaysInStage(stageHistory: StageHistoryEntry[]): number {
  if (!stageHistory.length) return 0;
  const lastEntry = stageHistory[stageHistory.length - 1];
  return Math.floor(
    (Date.now() - new Date(lastEntry.at).getTime()) / 86_400_000,
  );
}

function getAgingVariant(days: number): "muted" | "warning" | "default" {
  if (days < 1) return "muted";
  if (days <= 3) return "warning";
  return "warning"; // > 3 days still warning — red handled via subtext
}

function getAgingSubtext(days: number): string {
  if (days < 1) return "Sent today";
  if (days === 1) return "Sent yesterday";
  return `Sent ${days} days ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
  // Prepare AI assessment data
  // ---------------------------------------------------------------------------

  const rawAssessment = job.aiAssessment as Record<string, unknown> | null;
  let parsedAssessment: ConditionAssessment | null = null;

  if (rawAssessment && typeof rawAssessment === "object") {
    parsedAssessment = {
      ...rawAssessment,
      flags: normalizeFlags(rawAssessment.flags),
    } as ConditionAssessment;
  }

  let aiReasoning: string | null = null;
  if (parsedAssessment) {
    const descriptions = Object.values(parsedAssessment.scores)
      .filter((s) => s.description)
      .map((s) => s.description);
    if (descriptions.length > 0) {
      aiReasoning = descriptions.slice(0, 2).join(" ");
    }
  }

  const briefing = rawAssessment?.briefing as AiBriefing | undefined;
  const hasBriefing =
    job.analysisStatus === "complete" && !!briefing?.summary;

  const stage = job.stage as JobStage;
  const stageHistory = (job.stageHistory ?? []) as StageHistoryEntry[];
  const quoteTotal = job.finalQuote?.totalPrice;

  // ---------------------------------------------------------------------------
  // Reusable component fragments (avoid repetition across stages)
  // ---------------------------------------------------------------------------

  const headerZone = (
    <>
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
            <span className="text-[var(--color-muted)]">
              {" "}
              &mdash; {vehicle.color}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge
            stage={job.stage}
            analysisStatus={job.analysisStatus ?? ""}
          />
          <Link
            href={`/dashboard/jobs/${jobId}/review`}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
          >
            Edit job
          </Link>
        </div>
      </div>
      <StagePipeline currentStage={stage} />
    </>
  );

  const photoViewer = (
    <PhotoViewer
      jobId={job.id}
      initialPhotoCount={((job.photos ?? []) as unknown[]).length}
      hasNewPhotos={job.hasNewPhotos}
      customerEmail={customer.email ?? null}
      photoRequestSentAt={job.photoRequestSentAt?.toISOString() ?? null}
    />
  );

  const customerCard = (
    <CustomerCard
      customer={customer}
      createdAt={job.createdAt}
      intents={(job.intents ?? []) as string[]}
    />
  );

  const customerNotesCard = job.notes ? (
    <CustomerNotesCard notes={job.notes} />
  ) : null;

  const packagePricingCard = (
    <PackagePricingCard
      jobId={job.id}
      stage={job.stage}
      finalQuote={job.finalQuote}
      aiAssessment={parsedAssessment}
      analysisStatus={job.analysisStatus ?? ""}
    />
  );

  const aiConditionNotesCard = parsedAssessment ? (
    <AIConditionNotesCard
      jobId={job.id}
      flags={parsedAssessment.flags}
      reasoning={aiReasoning}
    />
  ) : null;

  const aiBriefingCard = hasBriefing ? (
    <AiBriefingCard briefing={briefing!} />
  ) : null;

  const jobNotesCard = (
    <JobNotes jobId={job.id} initialNotes={job.detailerNotes ?? ""} />
  );

  const analysisStatusPanel = (
    <AnalysisStatusPanel
      jobId={job.id}
      initialAnalysisStatus={job.analysisStatus}
      initialStage={job.stage}
      initialHasAssessment={job.aiAssessment !== null}
      initialRetryCount={job.analysisRetryCount}
      initialUpdatedAt={job.updatedAt.toISOString()}
      photoCount={(job.photos ?? []).length}
    />
  );

  const stageControlsSection = (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2
        className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-data)" }}
      >
        Stage
      </h2>
      <StageControls
        jobId={job.id}
        currentStage={stage}
        customerEmail={customer.email ?? undefined}
        quoteTotal={quoteTotal}
        quoteSentAt={job.quoteSentAt}
      />
    </section>
  );

  const stageHistorySection = (
    <CollapsibleSection
      title="History"
      count={stageHistory.length}
      defaultOpen={stage === "archived"}
    >
      <StageHistory history={stageHistory} />
    </CollapsibleSection>
  );

  const socialExportPanel = org ? (
    <SocialExportPanel
      jobId={job.id}
      afterPhotos={job.qcPhotos ?? []}
      plateBlockingEnabled={org.plateBlockingEnabled}
      watermarkEnabled={org.watermarkEnabled}
      hasLogo={!!org.logoUrl}
      shopName={org.shopName ?? org.name}
    />
  ) : null;

  // ---------------------------------------------------------------------------
  // Stage-specific zone compositions
  // ---------------------------------------------------------------------------

  function renderStageLayout() {
    switch (stage) {
      // ── created: Review AI assessment and build quote ────────────────
      case "created": {
        const isProcessing = job.analysisStatus === "processing";
        const isFailed = job.analysisStatus === "failed";
        const isComplete = job.analysisStatus === "complete";

        return (
          <>
            {/* Primary: analysis status or AI flags + CTA */}
            {(isProcessing || isFailed) && analysisStatusPanel}
            {isComplete && (
              <>
                {aiBriefingCard}
                {aiConditionNotesCard}
                <PrimaryActionBanner
                  heading="AI assessment ready"
                  subtext="Review the condition notes and build your quote"
                  ctaLabel="Review & Build Quote"
                  ctaHref={`/dashboard/jobs/${jobId}/review`}
                />
              </>
            )}

            {/* Context: photos + customer */}
            <div className="grid gap-4 md:grid-cols-2">
              {photoViewer}
              {customerCard}
            </div>
            {customerNotesCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="Pricing" defaultOpen={false}>
              {packagePricingCard}
            </CollapsibleSection>
            <CollapsibleSection title="Detailer Notes" defaultOpen={false}>
              {jobNotesCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );
      }

      // ── quoted: Send this quote to the customer ─────────────────────
      case "quoted":
        return (
          <>
            {/* Primary: quote summary + send CTA */}
            <PrimaryActionBanner
              heading={
                quoteTotal
                  ? `Quote ready — $${quoteTotal.toLocaleString()}`
                  : "Quote ready"
              }
              subtext="Review the line items, then send to your customer"
              ctaLabel="Send to Customer"
              ctaHref={`/dashboard/jobs/${jobId}/review`}
              variant="success"
            />
            {packagePricingCard}

            {/* Context: customer + notes */}
            {customerCard}
            {jobNotesCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            <CollapsibleSection title="Photos" defaultOpen={false}>
              {photoViewer}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── sent: Waiting on customer response ──────────────────────────
      case "sent": {
        const days = getDaysInStage(stageHistory);
        const agingVariant = getAgingVariant(days);
        const agingSubtext = getAgingSubtext(days);
        const showFollowUp = days >= 1;

        return (
          <>
            {/* Primary: aging indicator */}
            <PrimaryActionBanner
              heading={`Quote sent${quoteTotal ? ` — $${quoteTotal.toLocaleString()}` : ""}`}
              subtext={agingSubtext}
              ctaLabel={showFollowUp ? "Send Follow-Up" : undefined}
              ctaHref={showFollowUp ? `/dashboard/jobs/${jobId}/review` : undefined}
              variant={agingVariant}
            />

            {/* Context: pricing + customer for manual follow-up */}
            {packagePricingCard}
            {customerCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="Photos" defaultOpen={false}>
              {photoViewer}
            </CollapsibleSection>
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            <CollapsibleSection title="Detailer Notes" defaultOpen={false}>
              {jobNotesCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );
      }

      // ── approved: Customer approved — start when ready ──────────────
      case "approved":
        return (
          <>
            {/* Primary: start work CTA */}
            <PrimaryActionBanner
              heading={
                quoteTotal
                  ? `Approved — $${quoteTotal.toLocaleString()}`
                  : "Approved"
              }
              subtext="Customer approved the quote — start when ready"
              ctaLabel="Start Work"
              ctaHref={`/dashboard/jobs/${jobId}/review`}
              variant="success"
            />

            {/* Context: work reference */}
            {packagePricingCard}
            {customerCard}
            {photoViewer}
            {jobNotesCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── inProgress: Work underway ───────────────────────────────────
      case "inProgress":
        return (
          <>
            {/* Primary: move to QC CTA + notes for jotting during work */}
            <PrimaryActionBanner
              heading="In Progress"
              subtext="Jot notes below as you work, then move to QC when done"
              ctaLabel="Move to QC"
              ctaHref={`/dashboard/jobs/${jobId}/review`}
            />
            {jobNotesCard}

            {/* Context: work reference */}
            {packagePricingCard}
            {photoViewer}

            {/* Details: collapsed */}
            <CollapsibleSection title="Customer" defaultOpen={false}>
              {customerCard}
              {customerNotesCard}
            </CollapsibleSection>
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── qc: Upload after photos and complete checklist ──────────────
      case "qc":
        return (
          <>
            {/* Primary: QC CTA */}
            <PrimaryActionBanner
              heading="Quality Check"
              subtext="Upload after photos and complete the QC checklist"
              ctaLabel="Open QC Checklist"
              ctaHref={`/dashboard/jobs/${jobId}/qc`}
            />

            {/* Context: reference photos + what was scoped */}
            {photoViewer}
            {packagePricingCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="Customer" defaultOpen={false}>
              {customerCard}
            </CollapsibleSection>
            <CollapsibleSection title="Detailer Notes" defaultOpen={false}>
              {jobNotesCard}
            </CollapsibleSection>
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── complete: Job complete — share your work ────────────────────
      case "complete":
        return (
          <>
            {/* Primary: social export */}
            {socialExportPanel}

            {/* Context: before/after showcase + final summary */}
            {photoViewer}
            {packagePricingCard}

            {/* Details: collapsed */}
            <CollapsibleSection title="Customer" defaultOpen={false}>
              {customerCard}
            </CollapsibleSection>
            <CollapsibleSection title="Detailer Notes" defaultOpen={false}>
              {jobNotesCard}
            </CollapsibleSection>
            {stageHistorySection}
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── archived: Archived job ──────────────────────────────────────
      case "archived":
        return (
          <>
            {/* Primary: reopen CTA */}
            <PrimaryActionBanner
              heading="Archived"
              subtext="This job has been archived"
              ctaLabel="Reopen Job"
              ctaHref={`/dashboard/jobs/${jobId}/review`}
              variant="muted"
            />

            {/* Context: summary + history */}
            {packagePricingCard}
            {stageHistorySection}

            {/* Details: collapsed */}
            <CollapsibleSection title="Customer" defaultOpen={false}>
              {customerCard}
            </CollapsibleSection>
            <CollapsibleSection title="Photos" defaultOpen={false}>
              {photoViewer}
            </CollapsibleSection>
            <CollapsibleSection title="Detailer Notes" defaultOpen={false}>
              {jobNotesCard}
            </CollapsibleSection>
            <CollapsibleSection title="AI Condition Notes" defaultOpen={false}>
              {aiConditionNotesCard}
              {aiBriefingCard}
            </CollapsibleSection>
            <CollapsibleSection title="Stage Controls" defaultOpen={false}>
              {stageControlsSection}
            </CollapsibleSection>
          </>
        );

      // ── fallback (should not happen) ────────────────────────────────
      default:
        return (
          <>
            {packagePricingCard}
            {customerCard}
            {photoViewer}
            {jobNotesCard}
            {aiConditionNotesCard}
            {analysisStatusPanel}
            {stageControlsSection}
            {stageHistorySection}
          </>
        );
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {headerZone}
      <div className="mt-6 space-y-4">{renderStageLayout()}</div>
    </div>
  );
}
