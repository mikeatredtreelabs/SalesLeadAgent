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
      `You are an expert data engineer. Generate realistic synthetic demo data for a prospect meeting.
Return ONLY valid JSON, no markdown, no preamble. Keep all string values under 12 words.`,
      `Create a demo artifact for this opportunity at ${companyName}.

Opportunity: ${opportunity.title}
Problem: ${opportunity.problem}
Solution: ${opportunity.solution}

Return exactly this JSON shape:
{
  "title": "demo title (6 words max)",
  "description": "one sentence what this shows",
  "datasets": [
    {
      "name": "dataset name",
      "description": "what this data represents",
      "columns": ["col1", "col2", "col3", "col4"],
      "rows": [
        ["val1", "val2", "val3", "val4"]
      ],
      "note": "brief note"
    }
  ],
  "insights": [
    {
      "title": "insight title (4 words)",
      "value": "key metric",
      "description": "what this means (8 words max)",
      "type": "positive"
    }
  ],
  "chartData": {
    "title": "chart title",
    "type": "bar",
    "labels": ["label1", "label2"],
    "datasets": [
      {
        "name": "series name",
        "values": [10, 20],
        "color": "blue"
      }
    ]
  },
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Rules:
- datasets: exactly 1 dataset, exactly 10 rows, exactly 4 columns
- insights: exactly 4 items, types: positive/negative/warning/neutral
- chartData: exactly 10 labels with realistic values specific to ${companyName}
- keyFindings: exactly 3 items, each under 15 words
- nextSteps: exactly 3 items, each under 12 words
- Make data very specific to ${companyName} and their industry with realistic numbers`,
      2500
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
