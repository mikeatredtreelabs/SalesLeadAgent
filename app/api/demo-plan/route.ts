import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { opportunity, companyName } = await req.json();

  // Always check DB first
  const dbOp = await prisma.opportunity.findUnique({
    where: { id: opportunity.id },
    select: { demoPlan: true },
  });

  if (dbOp?.demoPlan) {
    try {
      return NextResponse.json({ demoPlan: JSON.parse(dbOp.demoPlan), cached: true });
    } catch {
      // If parse fails, regenerate
    }
  }

  try {
    const result = await runAgent(
      `You are an AI consultant preparing a demo plan for a prospect call. Be specific and practical.
Return ONLY valid JSON, no markdown, no preamble.`,
      `Create a demo plan for this AI consulting opportunity at ${companyName}.

Opportunity: ${opportunity.title}
Problem: ${opportunity.problem}
Solution: ${opportunity.solution}

Return exactly this JSON shape:
{
  "whatWeNeedFromClient": [
    "specific data or access item 1",
    "specific data or access item 2",
    "specific data or access item 3",
    "specific data or access item 4"
  ],
  "whatWeWillDo": [
    "specific step we will take 1",
    "specific step we will take 2",
    "specific step we will take 3",
    "specific step we will take 4",
    "specific step we will take 5"
  ],
  "demoDeliverable": "one sentence describing what they will see at the end of the demo",
  "timeToDemo": "estimated time to build the demo (e.g. 3-5 days)"
}

Be very specific to ${companyName} and their industry. Keep each bullet under 15 words.`,
      1000
    );

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { demoPlan: JSON.stringify(result) },
    });

    return NextResponse.json({ demoPlan: result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
