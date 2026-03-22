import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { render } from "@react-email/components";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobs, customers, vehicles, organizations } from "@/lib/db/schema";
import type { JobStage } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";
import { getResend, DEFAULT_FROM } from "@/lib/email";
import QuoteReadyEmail from "@/lib/email-templates/quote-ready";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  // Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await getDetailForgeOrgId(session.session.activeOrganizationId);
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 403 });
  }

  // Fetch job
  const [job] = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      finalQuote: jobs.finalQuote,
      customerId: jobs.customerId,
      vehicleId: jobs.vehicleId,
      quoteToken: jobs.quoteToken,
      quoteSentAt: jobs.quoteSentAt,
      stageHistory: jobs.stageHistory,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, orgId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Validate stage: must be "quoted" (first send) or "sent" (resend)
  if (job.stage !== "quoted" && job.stage !== "sent") {
    return NextResponse.json(
      { error: `Cannot send quote from "${job.stage}" stage` },
      { status: 400 },
    );
  }

  // Cooldown: prevent spamming customer inbox (minimum 60s between sends)
  if (job.quoteSentAt) {
    const secondsSinceLastSend =
      (Date.now() - new Date(job.quoteSentAt).getTime()) / 1000;
    if (secondsSinceLastSend < 60) {
      return NextResponse.json(
        { error: "Please wait before sending again." },
        { status: 429 },
      );
    }
  }

  // Validate quote exists
  if (!job.finalQuote || !job.finalQuote.totalPrice || job.finalQuote.totalPrice <= 0) {
    return NextResponse.json(
      { error: "Job has no finalized quote" },
      { status: 400 },
    );
  }

  // Fetch customer (org-scoped for defense-in-depth)
  const [customer] = await db
    .select({
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
    })
    .from(customers)
    .where(and(eq(customers.id, job.customerId), eq(customers.orgId, orgId)))
    .limit(1);

  if (!customer?.email) {
    return NextResponse.json(
      { error: "Customer has no email address" },
      { status: 400 },
    );
  }

  // Fetch vehicle (org-scoped for defense-in-depth)
  const [vehicle] = await db
    .select({
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(vehicles)
    .where(and(eq(vehicles.id, job.vehicleId), eq(vehicles.orgId, orgId)))
    .limit(1);

  const vehicleDescription = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "your vehicle";

  // Fetch org branding
  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      accentColor: organizations.accentColor,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const shopName = org?.shopName ?? org?.name ?? "Your Detailer";
  const brandColor = org?.accentColor ?? "#7C4DFF";
  const isResend = job.stage === "sent";

  // Always generate a fresh token (rotates on resend for security)
  const quoteToken = crypto.randomBytes(32).toString("hex");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://detailforge.io").replace(/\/+$/, "");
  const quoteUrl = `${appUrl}/quote/${quoteToken}`;

  // Build included line items for email
  const includedItems = job.finalQuote.lineItems
    .filter((item) => item.included)
    .map((item) => ({
      name: item.name,
      finalPrice: item.finalPrice,
    }));

  // Render email
  const emailHtml = await render(
    QuoteReadyEmail({
      shopName,
      shopLogo: org?.logoUrl,
      brandColor,
      customerFirstName: customer.firstName,
      vehicleDescription,
      lineItems: includedItems,
      totalPrice: job.finalQuote.totalPrice,
      quoteUrl,
    }),
  );

  // Send email
  let emailError: unknown = null;
  try {
    const result = await getResend().emails.send({
      from: DEFAULT_FROM,
      to: customer.email,
      subject: `${isResend ? "[Updated] " : ""}Your detailing quote from ${shopName}`,
      html: emailHtml,
    });
    emailError = result.error;
  } catch (err) {
    console.error("Email send error:", err);
    const message =
      err instanceof Error && err.message.includes("RESEND_API_KEY")
        ? "Email service not configured. Ask your admin to set up RESEND_API_KEY."
        : "Failed to send email. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (emailError) {
    console.error("Resend email error:", emailError);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 },
    );
  }

  // Build stage history entry
  const now = new Date();
  const historyEntry = {
    from: job.stage,
    to: "sent",
    at: now.toISOString(),
    note: isResend ? "Quote resent to customer" : "Quote sent to customer",
  };
  const updatedHistory = [...(job.stageHistory ?? []), historyEntry];

  // Update job with optimistic lock on current stage to prevent TOCTOU race
  const updateResult = await db
    .update(jobs)
    .set({
      quoteToken,
      quoteSentAt: now,
      ...(isResend ? {} : { stage: "sent" as JobStage }),
      stageHistory: updatedHistory,
      updatedAt: now,
    })
    .where(
      and(eq(jobs.id, jobId), eq(jobs.orgId, orgId), eq(jobs.stage, job.stage as JobStage)),
    );

  if (updateResult.rowCount === 0) {
    return NextResponse.json(
      { error: "Job stage changed. Please refresh and try again." },
      { status: 409 },
    );
  }

  // Mask email for response (show first char + domain)
  const [localPart, domain] = customer.email.split("@");
  const maskedEmail =
    localPart.length > 1
      ? `${localPart[0]}${"*".repeat(Math.min(localPart.length - 1, 5))}@${domain}`
      : `${localPart}@${domain}`;

  return NextResponse.json({
    ok: true,
    sentTo: maskedEmail,
    isResend,
  });
}
