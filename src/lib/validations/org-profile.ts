import { z } from "zod";

export const orgProfileUpdateSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  businessEmail: z.string().email("Valid email is required").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  website: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  shopName: z.string().optional().nullable(),
  shopTagline: z.string().max(120, "Tagline must be 120 characters or less").optional().nullable(),
  logoKey: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  nameFont: z
    .enum(["DM Sans", "JetBrains Mono", "Inter", "Space Grotesk"])
    .optional(),
});

export type OrgProfileUpdate = z.infer<typeof orgProfileUpdateSchema>;
