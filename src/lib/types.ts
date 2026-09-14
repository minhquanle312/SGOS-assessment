import type { AssessmentInput, AssessmentOutput } from "./schema";

export type EvaluationRecord = {
  id: string;
  input: AssessmentInput;
  output: AssessmentOutput;
  promptVersionId: string;
  createdAt: string;
};

export type EvaluationListItem = {
  id: string;
  learningGoal: string;
  createdAt: string;
};
