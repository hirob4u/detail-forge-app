import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, organizations, vehicles } from "@/lib/db/schema";
import CustomerPhotoUpload from "./customer-photo-upload";
import Wordmark from "@/components/wordmark";
import { colors } from "@/lib/design-tokens";
import { FONT_VARIABLES } from "@/lib/fonts";

export default async function PhotoUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token format before DB lookup (timing attack prevention)
  if (!/^[0-9a-f]{64}$/i.test(token)) {
    notFound();
  }

  // Look up job by token
  const [job] = await db
    .select({
      id: jobs.id,
      orgId: jobs.orgId,
      vehicleId: jobs.vehicleId,
      photos: jobs.photos,
    })
    .from(jobs)
    .where(eq(jobs.photoUploadToken, token))
    .limit(1);

  if (!job) {
    notFound();
  }

  // Fetch org for branding
  const [org] = await db
    .select({
      name: organizations.name,
      shopName: organizations.shopName,
      shopTagline: organizations.shopTagline,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
      nameFont: organizations.nameFont,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, job.orgId))
    .limit(1);

  if (!org) {
    notFound();
  }

  // Fetch vehicle for context display
  const [vehicle] = await db
    .select({ year: vehicles.year, make: vehicles.make, model: vehicles.model, color: vehicles.color })
    .from(vehicles)
    .where(eq(vehicles.id, job.vehicleId))
    .limit(1);

  const displayName = org.shopName ?? org.name;
  const brandColor = org.accentColor ?? colors.purpleAction;
  const existingPhotoCount = ((job.photos ?? []) as unknown[]).length;

  return (
    <div
      style={
        {
          "--color-brand": brandColor,
          "--color-brand-hover": `color-mix(in srgb, ${brandColor}, black 15%)`,
        } as React.CSSProperties
      }
      className="min-h-dvh flex flex-col bg-[var(--color-background)]"
    >
      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-8 py-6 sm:py-16">
        {/* Identity region */}
        <header className="mb-0 px-4 sm:px-0">
          <div className="flex items-center gap-4 mb-3">
            {org.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={displayName}
                className="h-14 w-auto max-w-[160px] object-contain flex-shrink-0 sm:h-20 sm:max-w-[200px]"
              />
            )}
            <span
              className="text-2xl sm:text-3xl font-semibold leading-tight text-[var(--color-text)]"
              style={{
                fontFamily: org.nameFont
                  ? FONT_VARIABLES[org.nameFont] ?? `'${org.nameFont}', sans-serif`
                  : "inherit",
              }}
            >
              {displayName}
            </span>
          </div>

          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] opacity-60 mb-6">
            Upload vehicle photos
          </p>

          <div
            className="h-0.5 w-10 mb-px"
            style={{ backgroundColor: brandColor }}
          />
          <hr className="border-[var(--color-border)]" />
        </header>

        {/* Content card */}
        <section className="mt-8 sm:mt-10 px-4 py-6 sm:rounded-[var(--radius-card)] sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-elevated)] sm:px-6 sm:py-8">
          {/* Vehicle context */}
          {vehicle && (
            <p className="mb-4 text-sm text-[var(--color-muted)]">
              Photos for your{" "}
              <span className="font-medium text-[var(--color-text)]">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
              {vehicle.color && (
                <span className="text-[var(--color-muted)]"> in {vehicle.color}</span>
              )}
            </p>
          )}

          {existingPhotoCount > 0 && (
            <p className="mb-4 text-xs text-[var(--color-muted)]">
              {existingPhotoCount} photo{existingPhotoCount !== 1 ? "s" : ""} already on file
            </p>
          )}

          <CustomerPhotoUpload
            token={token}
            orgSlug={org.slug}
          />
        </section>
      </main>

      {/* Powered by footer */}
      <footer className="py-5 text-center">
        <a
          href="https://detailforge.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-opacity hover:opacity-80"
        >
          <span className="opacity-50">Powered by</span>
          <Wordmark className="text-xs text-[var(--color-text)]" showDotIo />
        </a>
      </footer>
    </div>
  );
}
