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

  // Add flag-level items from AI assessment
  const flags = (aiAssessment?.flags as string[]) ?? [];
  flags.forEach((flag, i) => {
    // Skip non-correctable flags and metadata flags -- they are not work items
    if (
      flag.toLowerCase().includes("non-correctable") ||
      flag.toLowerCase().includes("customer should be aware") ||
      flag === "no-photos-submitted"
    )
      return;

    items.push({
      itemId: `flag-${i}`,
      label: flag,
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
