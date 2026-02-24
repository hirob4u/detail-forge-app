import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "canceled",
]);

export const jobStageEnum = pgEnum("job_stage", [
  "created",
  "sent",
  "approved",
  "inProgress",
  "qc",
  "complete",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "compound",
  "polish",
  "coating",
  "cleaner",
  "dressing",
  "pad",
  "towel",
  "other",
]);

export const unitMeasureEnum = pgEnum("unit_measure", ["oz", "ml", "each"]);

// ---------------------------------------------------------------------------
// Organizations -- tenant boundary
// ---------------------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  businessEmail: varchar("business_email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  website: varchar("website", { length: 500 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("trial"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Customers -- belongs to Organization
// ---------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    notes: text("notes"),
    lifetimeSpend: numeric("lifetime_spend", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    visitCount: integer("visit_count").notNull().default(0),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("customers_org_id_idx").on(table.orgId)],
);

// ---------------------------------------------------------------------------
// Vehicles -- belongs to Customer
// ---------------------------------------------------------------------------

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    make: varchar("make", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    color: varchar("color", { length: 100 }).notNull(),
    vin: varchar("vin", { length: 17 }).unique(),
    baselineConditionScore: numeric("baseline_condition_score", {
      precision: 5,
      scale: 2,
    }),
    protectionHistory: jsonb("protection_history"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vehicles_org_id_idx").on(table.orgId),
    index("vehicles_customer_id_idx").on(table.customerId),
  ],
);

// ---------------------------------------------------------------------------
// Jobs -- connects Vehicle to a service event
// ---------------------------------------------------------------------------

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    stage: jobStageEnum("stage").notNull().default("created"),
    aiAssessment: jsonb("ai_assessment"),
    detailerAdjustments: jsonb("detailer_adjustments"),
    estimateAmount: numeric("estimate_amount", { precision: 12, scale: 2 }),
    finalAmount: numeric("final_amount", { precision: 12, scale: 2 }),
    notes: text("notes"),
    stageHistory: jsonb("stage_history").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jobs_org_id_idx").on(table.orgId),
    index("jobs_vehicle_id_idx").on(table.vehicleId),
    index("jobs_customer_id_idx").on(table.customerId),
  ],
);

// ---------------------------------------------------------------------------
// Products -- supply catalog item belonging to Organization
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    category: productCategoryEnum("category").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
    unitSize: numeric("unit_size", { precision: 10, scale: 4 }).notNull(),
    unitMeasure: unitMeasureEnum("unit_measure").notNull(),
    costPerUnit: numeric("cost_per_unit", { precision: 12, scale: 4 }).notNull(),
    supplier: varchar("supplier", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("products_org_id_idx").on(table.orgId)],
);

// ---------------------------------------------------------------------------
// Usage Logs -- joins Product to Job
// ---------------------------------------------------------------------------

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantityUsed: numeric("quantity_used", { precision: 10, scale: 4 }).notNull(),
    unitMeasure: unitMeasureEnum("unit_measure").notNull(),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_logs_org_id_idx").on(table.orgId),
    index("usage_logs_job_id_idx").on(table.jobId),
    index("usage_logs_product_id_idx").on(table.productId),
  ],
);

// ---------------------------------------------------------------------------
// Better Auth -- user, session, account, verification
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ---------------------------------------------------------------------------
// Better Auth -- organization plugin (organization, member, invitation)
// ---------------------------------------------------------------------------

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

// ---------------------------------------------------------------------------
// Better Auth -- relations
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));
