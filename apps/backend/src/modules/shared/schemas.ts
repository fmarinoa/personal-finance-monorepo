import z from "zod";

export const periodSchema = z.object({
  startDate: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "number" ? val : Number(val)))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "startDate must be a positive number representing a timestamp",
    }),
  endDate: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "number" ? val : Number(val)))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "endDate must be a positive number representing a timestamp",
    }),
});

export const schemaForList = z.object({
  ...periodSchema.shape,
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});
