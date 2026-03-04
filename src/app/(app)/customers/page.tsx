import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { customers, jobs } from "@/lib/db/schema";
import { getDetailForgeOrgId } from "@/lib/org";

export default async function CustomersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const betterAuthOrgId = session.session.activeOrganizationId;
  const orgId = await getDetailForgeOrgId(betterAuthOrgId);
  if (!orgId) {
    redirect("/dashboard");
  }

  const customerList = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      jobCount: sql<number>`count(${jobs.id})::int`,
    })
    .from(customers)
    .leftJoin(jobs, eq(jobs.customerId, customers.id))
    .where(eq(customers.orgId, orgId))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt));

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-[var(--color-text)]">
        Customers
      </h1>

      {customerList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="mb-4 h-10 w-10 text-[var(--color-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">
            No customers yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Customers appear here automatically when they submit an estimate.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customerList.map((customer) => (
            <div
              key={customer.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {customer.email}
                  </p>
                  {customer.phone && (
                    <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                      {customer.phone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p
                    className="text-xs text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {customer.jobCount} {customer.jobCount === 1 ? "job" : "jobs"}
                  </p>
                  <p
                    className="mt-1 text-xs text-[var(--color-muted)]"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    Since {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
