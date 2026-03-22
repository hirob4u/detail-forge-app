import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { render } from "@react-email/components";
import { db } from "@/lib/db";
import { jobs, customers, vehicles, organizations } from "@/lib/db/schema";
import type { JobStage } from "@/lib/db/schema";
import { getResend, DEFAULT_FROM } from "@/lib/email";
import QuoteApprovedEmail from "@/lib/email-templates/quote-approved";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || !/^[0-9a-f]{64}$/i.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Look up job by quote token
  const [job] = await db
    .select({
      id: jobs.id,
      stage: jobs.stage,
      finalQuote: jobs.finalQuote,
      customerId: jobs.customerId,
      vehicleId: jobs.vehicleId,
      orgId: jobs.orgId,
      stageHistory: jobs.stageHistory,
    })
    .from(jobs)
    .where(eq(jobs.quoteToken, token))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Only allow approval from "sent" stage
  if (job.stage !== "sent") {
    if (job.stage === "approved" || job.stage === "inProgress" || job.stage === "qc" || job.stage === "complete") {
      return NextResponse.json(
        { error: "This quote has already been approved" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "This quote is not available for approval" },
      { status: 400 },
    );
  }

  // Fetch customer for notification
  const [customer] = await db
    .select({
      firstName: customers.firstName,
      lastName: customers.lastName,
    })
    .from(customers)
    .where(and(eq(customers.id, job.customerId), eq(customers.orgId, job.orgId)))
    .limit(1);

  // Fetch vehicle for notification (org-scoped for defense-in-depth)
  const [vehicle] = await db
    .select({
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(vehicles)
    .where(and(eq(vehicles.id, job.vehicleId), eq(vehicles.orgId, job.orgId)))
    .limit(1);

  // Fetch org for notification email
  const [org] = await db
    .select({
      shopName: organizations.shopName,
      name: organizations.name,
      businessEmail: organizations.businessEmail,
    })
    .from(organizations)
    .where(eq(organizations.id, job.orgId))
    .limit(1);

  // Transition to approved
  const now = new Date();
  const historyEntry = {
    from: "sent",
    to: "approved",
    at: now.toISOString(),
    note: "Customer approved via quote link",
  };
  const updatedHistory = [...(job.stageHistory ?? []), historyEntry];

  // Atomic transition: include stage="sent" in WHERE to prevent race conditions.
  // If two concurrent requests both read stage="sent", only one UPDATE will match.
  const updateResult = await db
    .update(jobs)
    .set({
      stage: "approved" as JobStage,
      approvedAt: now,
      stageHistory: updatedHistory,
      updatedAt: now,
    })
    .where(and(eq(jobs.id, job.id), eq(jobs.stage, "sent")));

  // If no rows updated, another request already approved this job
  if (updateResult.rowCount === 0) {
    return NextResponse.json(
      { error: "This quote has already been approved" },
      { status: 409 },
    );
  }

  // Send notification to detailer (best-effort — don't block the response)
  if (org?.businessEmail) {
    try {
      const customerName = customer
        ? `${customer.firstName} ${customer.lastName}`
        : "A customer";
      const vehicleDesc = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "a vehicle";
      const shopName = org.shopName ?? org.name;
      const totalPrice = job.finalQuote?.totalPrice ?? 0;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://detailforge.io";
      const jobUrl = `${appUrl}/dashboard/jobs/${job.id}`;

      const emailHtml = await render(
        QuoteApprovedEmail({
          shopName,
          customerName,
          vehicleDescription: vehicleDesc,
          totalPrice,
          jobUrl,
        }),
      );

      getResend()
        .emails.send({
          from: DEFAULT_FROM,
          to: org.businessEmail,
          subject: `${customerName} approved the $${Number(totalPrice).toFixed(2)} quote`,
          html: emailHtml,
        })
        .catch((err) => {
          console.error("Failed to send approval notification:", err);
        });
    } catch (err) {
      // Email not configured — approval still succeeds, notification skipped
      console.error("Approval notification skipped:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
