import { z } from "zod";

export const listCheckRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  page: z.coerce.number().int().min(1).optional().default(1)
});
