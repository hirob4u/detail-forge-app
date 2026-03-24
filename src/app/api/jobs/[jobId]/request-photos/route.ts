import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, customers, vehicles, organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDetailForgeOrgId } from "@/lib/org";
import { getResend, DEFAULT_FROM } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDetailForgeOrgId(session.session.activeOrganizationId);
  if (!orgId) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { jobId } = await params;

  // Fetch job with customer and vehicle info
  const [job] = await db
    .select({
      id: jobs.id,
      customerId: jobs.customerId,
      vehicleId: jobs.vehicleId,
      photoUploadToken: jobs.photoUploadToken,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const [customer] = await db
    .select({ firstName: customers.firstName, email: customers.email })
    .from(customers)
    .where(eq(customers.id, job.customerId))
    .limit(1);

  if (!customer?.email) {
    return NextResponse.json(
      { error: "Customer has no email address on file" },
      { status: 400 },
    );
  }

  const [vehicle] = await db
    .select({ year: vehicles.year, make: vehicles.make, model: vehicles.model })
    .from(vehicles)
    .where(eq(vehicles.id, job.vehicleId))
    .limit(1);

  const [org] = await db
    .select({
      name: organizations.name,
      shopName: organizations.shopName,
      accentColor: organizations.accentColor,
      logoUrl: organizations.logoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Generate token if not already set
  let token = job.photoUploadToken;
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    await db
      .update(jobs)
      .set({ photoUploadToken: token })
      .where(eq(jobs.id, jobId));
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://detailforge.io";
  const uploadUrl = `${baseUrl}/photos/${token}`;
  const shopName = org.shopName ?? org.name;
  const vehicleDescription = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "vehicle";

  // Dynamic import to avoid middleware bundle issues (forge pattern)
  const { render } = await import("@react-email/components");
  const { default: PhotoRequestEmail } = await import(
    "@/lib/email-templates/photo-request"
  );

  const html = await render(
    PhotoRequestEmail({
      shopName,
      shopLogo: org.logoUrl,
      brandColor: org.accentColor ?? "#7C4DFF",
      customerFirstName: customer.firstName,
      vehicleDescription,
      uploadUrl,
    }),
  );

  const resend = getResend();
  await resend.emails.send({
    from: DEFAULT_FROM,
    to: customer.email,
    subject: `${shopName} — we'd like a few photos of your vehicle`,
    html,
  });

  // Record when the request was sent
  await db
    .update(jobs)
    .set({ photoRequestSentAt: new Date() })
    .where(eq(jobs.id, jobId));

  return NextResponse.json({
    sentTo: customer.email,
    uploadUrl,
  });
}
