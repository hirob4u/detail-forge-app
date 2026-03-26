import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, customers } from "@/lib/db/schema";
import ReviewForm from "./review-form";
import type { FinalQuote } from "@/lib/types/quote";
import type { ConditionAssessment } from "@/lib/types/assessment";
import { normalizeFlags } from "@/lib/normalize-flags";

export default async function ReviewPage({
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
      finalQuote: jobs.finalQuote,
      photos: jobs.photos,
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

  if (!job.aiAssessment) {
    redirect(`/dashboard/jobs/${jobId}`);
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
    })
    .from(customers)
    .where(eq(customers.id, job.customerId))
    .limit(1);

  const rawAssessment = job.aiAssessment as Record<string, unknown>;
  const assessment: ConditionAssessment = {
    ...rawAssessment,
    flags: normalizeFlags(rawAssessment.flags),
  } as ConditionAssessment;
  const isQuoted = job.stage === "quoted";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ReviewForm
        jobId={job.id}
        assessment={assessment}
        vehicle={vehicle}
        customer={customer}
        createdAt={job.createdAt.toISOString()}
        stage={job.stage}
        isQuoted={isQuoted}
        existingQuote={isQuoted ? (job.finalQuote as FinalQuote | null) : null}
        hasPhotos={Array.isArray(job.photos) && job.photos.length > 0}
      />
    </div>
  );
}
