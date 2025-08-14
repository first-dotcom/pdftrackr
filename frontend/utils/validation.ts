import { z } from "zod";
import type { UserPlan, WaitlistPlan } from "@/shared/types";

// Plan Validation Schemas
export const userPlanSchema = z.enum(["free", "starter", "pro", "business"]) satisfies z.ZodType<UserPlan>;
export const waitlistPlanSchema = z.enum(["starter", "pro", "business", "either"]) satisfies z.ZodType<WaitlistPlan>;

// Helper function for plan validation
export const validatePlan = (plan: string): { valid: boolean; error?: string } => {
  try {
    userPlanSchema.parse(plan);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid plan selection" };
  }
};
