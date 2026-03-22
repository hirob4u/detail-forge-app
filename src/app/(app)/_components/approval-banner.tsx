import Link from "next/link";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { CheckCircle2 } from "lucide-react";

interface ApprovalBannerProps {
  orgId: string;
}

export default async function ApprovalBanner({ orgId }: ApprovalBannerProps) {
  // Count jobs approved within the last 48 hours
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .where(
      and(
        eq(jobs.orgId, orgId),
        eq(jobs.stage, "approved"),
        gt(jobs.approvedAt, sql`now() - interval '48 hours'`),
      ),
    );

  const count = result?.count ?? 0;

  if (count === 0) {
    return null;
  }

  return (
    <Link
      href="/jobs?stage=approved"
      className="mb-6 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 p-4 transition-colors hover:bg-[var(--color-amber)]/10"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-amber)]" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          {count} {count === 1 ? "quote" : "quotes"} recently approved
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          Ready to schedule — tap to view
        </p>
      </div>
    </Link>
  );
}
