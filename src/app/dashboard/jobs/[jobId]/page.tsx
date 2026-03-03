import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, customers } from "@/lib/db/schema";

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
      aiAssessment: jobs.aiAssessment,
      createdAt: jobs.createdAt,
      vehicleId: jobs.vehicleId,
      customerId: jobs.customerId,
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

  const hasAssessment = job.aiAssessment !== null;
  const isQuoted = job.stage === "quoted";

  const stageBadgeColor: Record<string, string> = {
    created: "text-[var(--color-amber)] border-[var(--color-amber)]",
    quoted: "text-[var(--color-cyan)] border-[var(--color-cyan)]",
    sent: "text-[var(--color-purple-text)] border-[var(--color-purple-text)]",
    approved: "text-[var(--color-green)] border-[var(--color-green)]",
  };

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

        {/* Review / Quote action */}
        {hasAssessment && (
          <Link
            href={`/dashboard/jobs/${jobId}/review`}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-purple-action)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-purple-deep)]"
          >
            {isQuoted ? "View Quote" : "Review Assessment"}
          </Link>
        )}
      </div>
    </div>
  );
}
