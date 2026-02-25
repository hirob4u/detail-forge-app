import { z } from "zod";

// --- Presign request ---

export const presignRequestSchema = z.object({
  orgSlug: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;

// --- Intake form submission ---

export const intakeSubmitSchema = z.object({
  orgSlug: z.string().min(1),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  vehicleYear: z
    .number()
    .int()
    .min(1900, "Enter a valid year")
    .max(new Date().getFullYear() + 2, "Enter a valid year"),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleColor: z.string().min(1, "Vehicle color is required"),
  notes: z.string().optional().default(""),
  photoUrls: z.array(z.string().url()).max(10).default([]),
});

export type IntakeSubmit = z.infer<typeof intakeSubmitSchema>;
