import type { JobStage } from "@/lib/db/schema";

export type StageTransition = {
  to: JobStage;
  label: string;
  direction: "forward" | "backward";
  confirmMessage?: string;
  /** When true, the confirmation dialog includes a required note input. */
  requireNote?: boolean;
};

export const STAGE_TRANSITIONS: Record<JobStage, StageTransition[]> = {
  created: [
    { to: "quoted", label: "Build Quote", direction: "forward" },
    {
      to: "archived",
      label: "Archive",
      direction: "forward",
      confirmMessage:
        "Archive this job? It will be hidden from the pipeline.",
    },
  ],
  quoted: [
    { to: "sent", label: "Mark Sent", direction: "forward" },
    {
      to: "created",
      label: "Back to New",
      direction: "backward",
      confirmMessage:
        "Move this job back to New? The quote will remain but the sent status will be cleared.",
    },
    {
      to: "archived",
      label: "Archive",
      direction: "forward",
      confirmMessage:
        "Archive this job? It will be hidden from the pipeline.",
    },
  ],
  sent: [
    { to: "approved", label: "Mark Approved", direction: "forward" },
    {
      to: "quoted",
      label: "Revise Quote",
      direction: "backward",
      confirmMessage:
        "Move this job back to Quoted to revise the quote?",
    },
    {
      to: "archived",
      label: "Archive",
      direction: "forward",
      confirmMessage:
        "Archive this job? It will be hidden from the pipeline.",
    },
  ],
  approved: [
    { to: "inProgress", label: "Start Job", direction: "forward" },
    {
      to: "sent",
      label: "Back to Sent",
      direction: "backward",
      confirmMessage:
        "Move this job back to Sent? This should only be used if the approval was made in error.",
    },
    {
      to: "archived",
      label: "Archive",
      direction: "forward",
      confirmMessage:
        "Archive this job? It will be hidden from the pipeline.",
    },
  ],
  inProgress: [
    { to: "qc", label: "Send to QC", direction: "forward" },
    {
      to: "approved",
      label: "Pause Job",
      direction: "backward",
      confirmMessage:
        "Pause this job and move it back to Approved?",
    },
  ],
  qc: [
    { to: "complete", label: "Mark Complete", direction: "forward" },
    {
      to: "inProgress",
      label: "Back to Work",
      direction: "backward",
      confirmMessage:
        "Send this job back to In Progress? Use this when QC reveals work that still needs doing.",
    },
  ],
  complete: [
    {
      to: "inProgress",
      label: "Reopen Job",
      direction: "backward",
      confirmMessage:
        "Reopen this job and send it back to In Progress? A reason is required for the audit trail.",
      requireNote: true,
    },
  ],
  archived: [
    {
      to: "created",
      label: "Restore Job",
      direction: "backward",
      confirmMessage: "Restore this job to New?",
    },
  ],
};

export const STAGE_LABELS: Record<JobStage, string> = {
  created: "New",
  quoted: "Quoted",
  sent: "Sent",
  approved: "Approved",
  inProgress: "In Progress",
  qc: "QC",
  complete: "Complete",
  archived: "Archived",
};
