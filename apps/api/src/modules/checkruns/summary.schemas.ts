import { z } from "zod";

export const monitorSummaryQuerySchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(168).optional().default(24)
});
