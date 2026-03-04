import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, vehicles, customers } from "@/lib/db/schema";
import ReviewForm from "./review-form";
import type { FinalQuote } from "@/lib/types/quote";

interface ConditionAssessment {
  vehicleVerification?: {
    appearsToMatch: boolean;
    observedVehicle: string;
    submittedVehicle: string;
    mismatchNote: string | null;
  };
  scores: {
    paintCondition: { score: number | null; description: string; recommendedService: string };
    scratchSeverity: { score: number | null; description: string; recommendedService: string };
    contamination: { score: number | null; description: string; recommendedService: string };
    interior: { score: number | null; description: string; recommendedService: string };
    wheelsTrim: { score: number | null; description: string; recommendedService: string };
  };
  recommendedServices: Array<{
    name: string;
    note?: string;
    basePrice: number;
    adjustedPrice: number;
  }>;
  confidence: number;
  flags: string[];
}

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

  const assessment = job.aiAssessment as ConditionAssessment;
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
      />
    </div>
  );
}
