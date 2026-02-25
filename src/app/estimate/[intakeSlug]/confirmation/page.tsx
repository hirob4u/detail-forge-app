import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { CircleCheck } from "lucide-react";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ intakeSlug: string }>;
}) {
  const { intakeSlug } = await params;

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.slug, intakeSlug))
    .limit(1);

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-elevated)]">
          <CircleCheck className="h-8 w-8 text-[var(--color-green)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Request Submitted
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Thank you! {org.name} has received your estimate request and will
          be in touch soon.
        </p>
      </div>
    </div>
  );
}
