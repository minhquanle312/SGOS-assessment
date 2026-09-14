import { AssessmentInput, AssessmentOutput, assessmentOutputSchema } from "./schema";

export const DEFAULT_SYSTEM_PROMPT = `You are a student development assistant inside SGOS (Student Growth OS).
Given a self-learner's goal, current activities, strengths, challenges and short-term goal,
produce a structured assessment that helps them see their situation clearly and act on it.

Respond with ONLY a JSON object matching exactly this shape, no extra commentary:
{
  "summary": "2-3 sentence overview of the student's current situation",
  "observations": ["3-5 specific, non-generic observations drawn from the input"],
  "suggested_actions": ["3-5 concrete actions the student can take, each actionable and specific"],
  "short_term_plan": ["3-5 ordered steps forming a short-term plan toward their stated goal"]
}`;

function buildUserPrompt(input: AssessmentInput): string {
  return `Learning goal: ${input.learningGoal}
Current learning activities: ${input.currentActivities}
Strengths: ${input.strengths}
Challenges: ${input.challenges}
Short-term goal: ${input.shortTermGoal}`;
}

export class AiConfigError extends Error {}
export class AiProviderError extends Error {}
export class AiInvalidResponseError extends Error {}

async function callOnce(systemPrompt: string, input: AssessmentInput): Promise<string> {
  const baseUrl = process.env.AI_API_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  if (!baseUrl || !apiKey) {
    throw new AiConfigError("AI provider is not configured (missing AI_API_BASE_URL or AI_API_KEY)");
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserPrompt(input) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
      // without this, an unreachable/hanging AI provider (network egress
      // blocked, DNS failure) leaves fetch pending forever: no error, no
      // log, "Analyzing..." stuck on the frontend with nothing to debug.
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new AiProviderError(`AI provider request failed: ${reason}`);
  }

  if (!res.ok) {
    throw new AiProviderError(`AI provider responded with status ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AiInvalidResponseError("AI response missing message content");
  }
  return content;
}

export async function generateAssessment(
  systemPrompt: string,
  input: AssessmentInput
): Promise<AssessmentOutput> {
  let raw: string;
  try {
    raw = await callOnce(systemPrompt, input);
  } catch (err) {
    if (err instanceof AiConfigError) throw err;
    // one retry on network failure / non-2xx status
    raw = await callOnce(systemPrompt, input);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AiInvalidResponseError("AI response is not valid JSON");
  }

  const result = assessmentOutputSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AiInvalidResponseError("AI response does not match expected schema");
  }
  return result.data;
}
