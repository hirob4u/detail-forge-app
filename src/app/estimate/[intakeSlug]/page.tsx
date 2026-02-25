import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import IntakeForm from "./intake-form";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ intakeSlug: string }>;
}) {
  const { intakeSlug } = await params;

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, intakeSlug))
    .limit(1);

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-purple-text)]">
            {org.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Request a detailing estimate
          </p>
        </div>
        <IntakeForm orgSlug={org.slug} orgName={org.name} />
      </div>
    </div>
  );
}
