import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
});

export type LeadInput = z.infer<typeof leadSchema>;
