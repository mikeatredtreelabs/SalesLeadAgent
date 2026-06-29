import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { opportunity, demoPlan, companyName } = await req.json();

  // Check cache first
  const dbOp = await prisma.opportunity.findUnique({
    where: { id: opportunity.id },
    select: { demoArtifact: true },
  });
  if (dbOp?.demoArtifact) {
    try {
      return NextResponse.json({ artifact: JSON.parse(dbOp.demoArtifact), cached: true });
    } catch {}
  }

  try {
    const result = await runAgent(
      `You are an expert data engineer and AI consultant. Generate realistic synthetic demo data and a complete self-contained demo for a prospect meeting.
Return ONLY valid JSON, no markdown, no preamble. The data must look real and industry-specific.`,
      `Create a complete demo artifact for this AI consulting opportunity at ${companyName}.

Opportunity: ${opportunity.title}
Problem: ${opportunity.problem}
Solution: ${opportunity.solution}
Business value: ${opportunity.value}

What the demo plan says we need from the client:
${(demoPlan?.whatWeNeedFromClient || []).map((item: string, i: number) => `${i+1}. ${item}`).join('\n')}

What we said we would do:
${(demoPlan?.whatWeWillDo || []).map((item: string, i: number) => `${i+1}. ${item}`).join('\n')}

Generate a complete demo artifact with realistic synthetic data. Return exactly this JSON shape:

{
  "title": "demo title",
  "description": "one sentence what this demo shows",
  "datasets": [
    {
      "name": "dataset name (e.g. Sales History)",
      "description": "what this data represents",
      "columns": ["col1", "col2", "col3"],
      "rows": [
        ["val1", "val2", "val3"],
        ["val1", "val2", "val3"]
      ],
      "note": "brief note about this dataset"
    }
  ],
  "insights": [
    {
      "title": "insight title",
      "value": "the key number or finding",
      "description": "what this means for the business",
      "type": "positive|negative|warning|neutral"
    }
  ],
  "chartData": {
    "title": "chart title",
    "type": "line|bar",
    "labels": ["label1", "label2"],
    "datasets": [
      {
        "name": "series name",
        "values": [10, 20, 30],
        "color": "blue|red|green|amber"
      }
    ]
  },
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "nextSteps": ["next step 1", "next step 2", "next step 3"]
}

Make the data very specific to ${companyName} and their industry. Use realistic numbers, SKU names, dates, dollar amounts. Generate at least 12 rows per dataset. Keep each dataset to 4-5 columns max. Generate 4-6 insights. Chart should have 8-12 labels with realistic values.`,
      3000
    );

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { demoArtifact: JSON.stringify(result) },
    });

    return NextResponse.json({ artifact: result, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
