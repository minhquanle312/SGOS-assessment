import { NextResponse } from "next/server";
import { assessmentInputSchema } from "@/lib/schema";
import { generateAssessment, AiConfigError, AiProviderError, AiInvalidResponseError } from "@/lib/ai";
import { getActivePromptVersion } from "@/lib/prompt";
import { prisma } from "@/lib/prisma";

async function logRequest(params: {
  evaluationId: string | null;
  statusCode: number;
  latencyMs: number;
  errorMessage?: string;
}) {
  try {
    await prisma.requestLog.create({
      data: {
        evaluationId: params.evaluationId,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        errorMessage: params.errorMessage,
      },
    });
  } catch (err) {
    // Logging must never break the response to the user.
    console.error("Failed to write request log", err);
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await logRequest({ evaluationId: null, statusCode: 400, latencyMs: Date.now() - startedAt, errorMessage: "Invalid JSON body" });
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = assessmentInputSchema.safeParse(body);
  if (!parsed.success) {
    const details = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])
    );
    await logRequest({ evaluationId: null, statusCode: 400, latencyMs: Date.now() - startedAt, errorMessage: "Invalid input" });
    return NextResponse.json({ error: "Invalid input", details }, { status: 400 });
  }

  try {
    const promptVersion = await getActivePromptVersion();
    const result = await generateAssessment(promptVersion.content, parsed.data);

    const evaluation = await prisma.evaluation.create({
      data: {
        input: parsed.data,
        output: result,
        promptVersionId: promptVersion.id,
      },
    });

    await logRequest({ evaluationId: evaluation.id, statusCode: 200, latencyMs: Date.now() - startedAt });
    return NextResponse.json(evaluation, { status: 200 });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    if (err instanceof AiConfigError) {
      await logRequest({ evaluationId: null, statusCode: 500, latencyMs, errorMessage: err.message });
      return NextResponse.json({ error: "AI provider is not configured" }, { status: 500 });
    }
    if (err instanceof AiProviderError) {
      await logRequest({ evaluationId: null, statusCode: 502, latencyMs, errorMessage: err.message });
      return NextResponse.json({ error: "AI service is currently unavailable, please try again" }, { status: 502 });
    }
    if (err instanceof AiInvalidResponseError) {
      await logRequest({ evaluationId: null, statusCode: 422, latencyMs, errorMessage: err.message });
      return NextResponse.json({ error: "AI returned an unexpected response, please try again" }, { status: 422 });
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    await logRequest({ evaluationId: null, statusCode: 500, latencyMs, errorMessage: message });
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
