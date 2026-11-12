import { z } from "zod";

// Validation rules for adding an account via the drawer form
export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

export type AccountInput = z.infer<typeof accountSchema>;

