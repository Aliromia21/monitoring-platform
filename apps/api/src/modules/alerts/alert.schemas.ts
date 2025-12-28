import { z } from "zod";

export const listAlertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1),
  monitorId: z.string().optional()
});
