import { z } from "zod";

export const assessmentInputSchema = z.object({
  learningGoal: z.string().trim().min(1, "Learning goal is required").max(500),
  currentActivities: z.string().trim().min(1, "Current activities is required").max(1000),
  strengths: z.string().trim().min(1, "Strengths is required").max(500),
  challenges: z.string().trim().min(1, "Challenges is required").max(500),
  shortTermGoal: z.string().trim().min(1, "Short-term goal is required").max(500),
});

export type AssessmentInput = z.infer<typeof assessmentInputSchema>;

export const assessmentOutputSchema = z.object({
  summary: z.string().min(1),
  observations: z.array(z.string().min(1)).min(1),
  suggested_actions: z.array(z.string().min(1)).min(1),
  short_term_plan: z.array(z.string().min(1)).min(1),
});

export type AssessmentOutput = z.infer<typeof assessmentOutputSchema>;
