import Link from "next/link";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jobs, customers, vehicles } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { getDetailForgeOrgId } from "@/lib/org";
import JobCard from "../_components/job-card";
import { STAGE_CONFIG } from "../_components/stage-config";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          No organization selected. Create or join an organization to get
          started.
        </p>
      </div>
    );
  }

  // Stage counts
  const stageCounts = await db
    .select({
      stage: jobs.stage,
      count: sql<number>`count(*)::int`,
    })
    .from(jobs)
    .where(eq(jobs.orgId, orgId))
    .groupBy(jobs.stage);

  const countMap: Record<string, number> = {};
  for (const row of stageCounts) {
    countMap[row.stage] = row.count;
  }

  // Recent jobs
  const recentJobs = await db
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
    .where(eq(jobs.orgId, orgId))
    .orderBy(desc(jobs.createdAt))
    .limit(10);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-[var(--color-text)]">
        Dashboard
      </h1>

      {/* Stage summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
          <Link
            key={stage}
            href={`/jobs?stage=${stage}`}
            className={cn(
              "rounded-[var(--radius-card)] border p-4 transition-colors hover:brightness-110",
              config.bg,
              config.border,
            )}
          >
            <p
              className={cn("text-2xl font-bold", config.color)}
              style={{ fontFamily: "var(--font-data)" }}
            >
              {countMap[stage] || 0}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
              {config.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent jobs */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Recent Jobs
        </h2>
        <Link
          href="/jobs"
          className="text-sm text-[var(--color-purple-text)] transition-colors hover:text-[var(--color-purple-action)]"
        >
          View all
        </Link>
      </div>

      {recentJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
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
          {recentJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
