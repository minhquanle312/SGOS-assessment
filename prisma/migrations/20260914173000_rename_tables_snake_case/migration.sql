-- Rename tables to lower_snake_case, plural. Uses RENAME (not drop/create)
-- so existing data and rows are preserved.

ALTER TABLE "PromptVersion" RENAME TO "prompt_versions";
ALTER TABLE "Evaluation" RENAME TO "evaluations";
ALTER TABLE "RequestLog" RENAME TO "request_logs";

ALTER TABLE "prompt_versions" RENAME CONSTRAINT "PromptVersion_pkey" TO "prompt_versions_pkey";
ALTER TABLE "evaluations" RENAME CONSTRAINT "Evaluation_pkey" TO "evaluations_pkey";
ALTER TABLE "request_logs" RENAME CONSTRAINT "RequestLog_pkey" TO "request_logs_pkey";

ALTER TABLE "evaluations" RENAME CONSTRAINT "Evaluation_promptVersionId_fkey" TO "evaluations_promptVersionId_fkey";
ALTER TABLE "request_logs" RENAME CONSTRAINT "RequestLog_evaluationId_fkey" TO "request_logs_evaluationId_fkey";

ALTER INDEX "PromptVersion_name_version_key" RENAME TO "prompt_versions_name_version_key";
