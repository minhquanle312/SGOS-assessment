import { PrismaClient } from "@prisma/client";
import { DEFAULT_SYSTEM_PROMPT } from "../src/lib/ai";
import { EVALUATION_PROMPT_NAME } from "../src/lib/prompt";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.promptVersion.findFirst({
    where: { name: EVALUATION_PROMPT_NAME },
  });
  if (existing) {
    console.log(`Prompt "${EVALUATION_PROMPT_NAME}" already has versions, skipping seed.`);
    return;
  }

  await prisma.promptVersion.create({
    data: {
      name: EVALUATION_PROMPT_NAME,
      version: 1,
      content: DEFAULT_SYSTEM_PROMPT,
      isActive: true,
    },
  });
  console.log(`Seeded "${EVALUATION_PROMPT_NAME}" v1 as active.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
