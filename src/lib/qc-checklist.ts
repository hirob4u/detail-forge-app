import { normalizeFlags } from "@/lib/normalize-flags";

export type ChecklistItem = {
  itemId: string;
  label: string;
  status: "pending" | "pass" | "needs-work";
  note?: string;
};

export function generateQcChecklist(
  aiAssessment: Record<string, unknown> | null,
  services: string[],
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Add service-level items from the finalized quote
  services.forEach((service, i) => {
    items.push({
      itemId: `service-${i}`,
      label: service,
      status: "pending",
    });
  });

  // Add flag-level items from AI assessment (handles both legacy
  // string[] and new structured ConditionFlag[] formats)
  const flags = normalizeFlags(aiAssessment?.flags);
  flags.forEach((flag, i) => {
    // Skip informational flags and metadata flags -- they are not work items
    const searchText = `${flag.title} ${flag.description}`.toLowerCase();
    if (
      searchText.includes("non-correctable") ||
      searchText.includes("customer should be aware") ||
      flag.title === "No Photos Submitted" ||
      flag.severity === "clear" ||
      flag.severity === "upsell"
    )
      return;

    items.push({
      itemId: `flag-${i}`,
      label: `${flag.title}: ${flag.description}`,
      status: "pending",
    });
  });

  // Always add a final walk-around item
  items.push({
    itemId: "walkthrough",
    label: "Final walk-around complete -- vehicle clean, no product residue, no missed areas",
    status: "pending",
  });

  return items;
}
