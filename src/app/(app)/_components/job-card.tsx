import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import StageBadge from "./stage-badge";
import type { FinalQuote } from "@/lib/types/quote";

interface JobCardProps {
  job: {
    id: string;
    stage: string;
    analysisStatus: string;
    createdAt: Date;
    finalQuote: FinalQuote | null;
    approvedAt?: Date | null;
    customer: {
      firstName: string | null;
      lastName: string | null;
    } | null;
    vehicle: {
      year: number | null;
      make: string | null;
      model: string | null;
      color: string | null;
    } | null;
  };
}

export default function JobCard({ job }: JobCardProps) {
  // isNewlyApproved is computed server-side and passed via the approvedAt prop;
  // we check the field existence here since server already filtered by recency.
  const isNewlyApproved =
    job.stage === "approved" && job.approvedAt != null;

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="block rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 transition-colors hover:border-[var(--color-purple-action)]/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Customer name + stage badge */}
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {job.customer?.firstName}{job.customer?.lastName ? ` ${job.customer.lastName}` : ""}
            </span>
            <StageBadge
              stage={job.stage}
              analysisStatus={job.analysisStatus}
            />
            {isNewlyApproved && (
              <span
                className="text-[10px] font-bold uppercase text-[var(--color-amber)] bg-[var(--color-amber)]/10 px-1.5 py-0.5 rounded-[var(--radius-badge)]"
                style={{ fontFamily: "var(--font-data)" }}
              >
                New
              </span>
            )}
          </div>
          {/* Vehicle */}
          <p className="text-sm text-[var(--color-muted)]">
            {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
            {job.vehicle?.color ? ` \u00b7 ${job.vehicle.color}` : ""}
          </p>
          {/* Timestamp */}
          <p
            className="mt-2 text-xs text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-data)" }}
          >
            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
          </p>
        </div>
        {/* Right side -- quote amount or arrow */}
        <div className="flex-shrink-0 text-right">
          {job.finalQuote?.totalPrice ? (
            <span
              className="text-base font-bold text-[var(--color-text)]"
              style={{ fontFamily: "var(--font-data)" }}
            >
              ${Number(job.finalQuote.totalPrice).toFixed(2)}
            </span>
          ) : (
            <ArrowRight className="h-4 w-4 text-[var(--color-muted)]" />
          )}
        </div>
      </div>
    </Link>
  );
}
