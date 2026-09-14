import { prisma } from "./prisma";
import { DEFAULT_SYSTEM_PROMPT } from "./ai";

export const EVALUATION_PROMPT_NAME = "evaluation-system-prompt";

/**
 * Returns the active PromptVersion for evaluations, creating v1 from
 * DEFAULT_SYSTEM_PROMPT the first time this is called against an empty table.
 */
export async function getActivePromptVersion() {
  const active = await prisma.promptVersion.findFirst({
    where: { name: EVALUATION_PROMPT_NAME, isActive: true },
    orderBy: { version: "desc" },
  });
  if (active) return active;

  return prisma.promptVersion.create({
    data: {
      name: EVALUATION_PROMPT_NAME,
      version: 1,
      content: DEFAULT_SYSTEM_PROMPT,
      isActive: true,
    },
  });
}
