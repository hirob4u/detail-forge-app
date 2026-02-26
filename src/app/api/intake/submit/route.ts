import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, customers, vehicles, jobs } from "@/lib/db/schema";
import { intakeSubmitSchema } from "@/lib/validations/intake";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = intakeSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Look up org by slug
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, data.orgSlug))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Sequential inserts (neon-http driver doesn't support interactive transactions).
    // Insert customer
    const [customer] = await db
      .insert(customers)
      .values({
        orgId: org.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: "", // TODO: VERIFY — address is NOT NULL but not collected on intake
      })
      .returning({ id: customers.id });

    // Insert vehicle
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        orgId: org.id,
        customerId: customer.id,
        year: data.vehicleYear,
        make: data.vehicleMake,
        model: data.vehicleModel,
        color: data.vehicleColor,
      })
      .returning({ id: vehicles.id });

    // Insert job
    const [job] = await db
      .insert(jobs)
      .values({
        orgId: org.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        photos: data.photoKeys.map((key: string) => ({
          key,
          phase: "before",
          area: "untagged",
        })),
        notes: data.notes || null,
      })
      .returning({ id: jobs.id });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (err) {
    console.error("Intake submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit intake request" },
      { status: 500 },
    );
  }
}
