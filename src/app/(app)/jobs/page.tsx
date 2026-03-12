import Link from "next/link";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Car } from "lucide-react";
import { db } from "@/lib/db";
import { jobs, customers, vehicles } from "@/lib/db/schema";
import type { jobStageEnum } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { getDetailForgeOrgId } from "@/lib/org";
import JobCard from "../_components/job-card";

// TODO: VERIFY -- consider deriving tabs from STAGE_CONFIG
const tabs: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  { label: "New", value: "created" },
  { label: "Quoted", value: "quoted" },
  { label: "Sent", value: "sent" },
  { label: "Approved", value: "approved" },
  { label: "In Progress", value: "inProgress" },
  { label: "QC", value: "qc" },
  { label: "Complete", value: "complete" },
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    redirect("/dashboard");
  }

  const { stage: stageParam } = await searchParams;
  const activeStage = (stageParam as (typeof jobStageEnum.enumValues)[number]) || null;

  const whereConditions = activeStage
    ? and(eq(jobs.orgId, orgId), eq(jobs.stage, activeStage))
    : eq(jobs.orgId, orgId);

  const jobList = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      analysisStatus: jobs.analysisStatus,
      createdAt: jobs.createdAt,
      finalQuote: jobs.finalQuote,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
      },
      vehicle: {
        year: vehicles.year,
        make: vehicles.make,
        model: vehicles.model,
        color: vehicles.color,
      },
    })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
    .where(whereConditions)
    .orderBy(desc(jobs.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Jobs</h1>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          All incoming estimates and active jobs
        </p>
      </div>

      {/* Stage filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {tabs.map((tab) => {
          const isActive = activeStage === tab.value;
          const href = tab.value ? `/jobs?stage=${tab.value}` : "/jobs";
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors border-b-2",
                isActive
                  ? "border-[var(--color-purple-action)] text-[var(--color-text)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Job list */}
      {jobList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Car className="mb-4 h-10 w-10 text-[var(--color-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">
            No jobs yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Jobs appear here when customers submit estimates via your intake
            link.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobList.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
