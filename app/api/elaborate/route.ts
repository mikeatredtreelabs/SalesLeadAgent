import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { opportunity, companyName } = await req.json();
  const t0 = Date.now();

  // Always check DB first — don't trust client-passed object
  const dbOp = await prisma.opportunity.findUnique({
    where: { id: opportunity.id },
    select: { elaboration: true },
  });
  const t1 = Date.now();
  console.log(`[elaborate] DB lookup: ${t1 - t0}ms | cached: ${!!dbOp?.elaboration}`);

  if (dbOp?.elaboration) {
    console.log(`[elaborate] Returning cached result (${dbOp.elaboration.length} chars)`);
    return NextResponse.json({ explanation: dbOp.elaboration, cached: true });
  }

  console.log(`[elaborate] No cache found — calling Claude...`);
  try {
    const t2 = Date.now();
    const result = await runAgent(
      `You are an AI consultant explaining a consulting opportunity in plain English. 
Write 4 short paragraphs — no bullet points, no headers, no jargon. 
Conversational tone, like you're briefing a colleague before a client call.`,
      `Explain this opportunity for ${companyName} so I fully understand what we'd actually build and do for this client.

Opportunity: ${opportunity.title}
Problem: ${opportunity.problem}
Solution: ${opportunity.solution}
Business value: ${opportunity.value}

Write exactly 4 short paragraphs:
1. What the current painful situation looks like day-to-day for this company
2. Exactly what we would build or set up — in plain terms a non-technical person would understand
3. What changes for their team once it's in place — what they stop doing manually
4. Why this is a good fit for an AI consulting engagement

Return ONLY a JSON object: { "explanation": "your full explanation here with paragraphs separated by double newlines" }`,
      800
    );
    const t3 = Date.now();
    console.log(`[elaborate] Claude call: ${t3 - t2}ms`);

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { elaboration: result.explanation },
    });
    const t4 = Date.now();
    console.log(`[elaborate] DB save: ${t4 - t3}ms | total: ${t4 - t0}ms`);

    return NextResponse.json({ explanation: result.explanation, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
