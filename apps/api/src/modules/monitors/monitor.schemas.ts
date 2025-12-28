import { z } from "zod";

export const httpMethodSchema = z.enum(["GET", "POST", "PUT", "HEAD"]);

export const createMonitorSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.literal("HTTP").optional().default("HTTP"),

  url: z.string().url().max(2048),
  method: httpMethodSchema.optional().default("GET"),

  interval: z.number().int().min(10).max(3600).optional().default(60),
  timeout: z.number().int().min(100).max(30000).optional().default(5000),

  expectedStatus: z.number().int().min(100).max(599).optional().default(200),
  enabled: z.boolean().optional().default(true)
});

export const updateMonitorSchema = z.object({
  name: z.string().min(1).max(120).optional(),

  url: z.string().url().max(2048).optional(),
  method: httpMethodSchema.optional(),

  interval: z.number().int().min(10).max(3600).optional(),
  timeout: z.number().int().min(100).max(30000).optional(),

  expectedStatus: z.number().int().min(100).max(599).optional(),
  enabled: z.boolean().optional()
}).refine((v) => Object.keys(v).length > 0, {
  message: "At least one field must be provided"
});

// Pagination for GET /monitors
export const listMonitorsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1)
});
