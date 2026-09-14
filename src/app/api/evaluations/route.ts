import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AssessmentInput } from "@/lib/schema";

export async function GET() {
  const evaluations = await prisma.evaluation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, input: true, createdAt: true },
  });

  const items = evaluations.map((e) => ({
    id: e.id,
    createdAt: e.createdAt,
    learningGoal: (e.input as unknown as AssessmentInput).learningGoal,
  }));

  return NextResponse.json({ items }, { status: 200 });
}
