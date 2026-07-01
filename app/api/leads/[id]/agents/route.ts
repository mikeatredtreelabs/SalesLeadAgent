import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runAgent, stripEmphasisDashes } from '@/lib/ai';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const { agent, input } = await req.json();
  const { id: leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    include: { contacts: true, research: { take: 1, orderBy: { createdAt: 'desc' } }, opportunities: true },
  });
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const research = lead.research[0];

  try {
    if (agent === 'research') {
      const result = await runAgent(
        `You are a senior AI consulting analyst. Analyze this company for AI consulting opportunities.
Return ONLY valid JSON, no markdown, no preamble. Be honest — distinguish known facts from inferences.
Return exactly:
{
  "summary": "2-3 sentence summary",
  "whatTheyDo": "what the company does",
  "techMaturity": "low/medium/high — brief reason",
  "painPoints": ["pain 1","pain 2","pain 3","pain 4"],
  "consultingAngle": "specific recommended first engagement",
  "confidence": 0.0-1.0,
  "assumptions": ["assumption 1","assumption 2"]
}`,
        `Company: ${lead.companyName}
Website: ${lead.website || 'unknown'}
Industry: ${lead.industry || 'unknown'}
Size: ${lead.size || 'unknown'}
Location: ${lead.location || 'unknown'}
Notes/raw input: ${input || lead.notes || 'No additional context — infer from company name and industry.'}`,
        1200
      );
      const saved = await prisma.companyResearch.create({
        data: { leadId, ...result, painPoints: result.painPoints, assumptions: result.assumptions, rawInput: input }
      });
      await prisma.lead.update({ where: { id: leadId }, data: { status: lead.status === 'New' ? 'Researching' : lead.status } });
      await prisma.agentActivity.create({
        data: { leadId, agent: 'Research Agent', action: 'Company research generated', detail: `Confidence: ${Math.round((result.confidence || 0.7) * 100)}%` }
      });
      return NextResponse.json({ ok: true, data: saved });
    }

    if (agent === 'score') {
      const ctx = research ? `Summary: ${research.summary}\nPain points: ${JSON.stringify(research.painPoints)}\nAngle: ${research.consultingAngle}` : `Company: ${lead.companyName}, Industry: ${lead.industry}`;
      const result = await runAgent(
        `You score sales leads for an AI consultant. Background: C#, Azure, SQL Server, Business Central, logistics, trade, enterprise software. Target: SMBs with manual processes.
Return ONLY valid JSON:
{
  "total": 0-100,
  "industryFit": 0-20,
  "manualProcessSignals": 0-20,
  "documentHeaviness": 0-15,
  "budgetPotential": 0-10,
  "backgroundRelevance": 0-10,
  "urgencySignals": 0-10,
  "companySize": 0-10,
  "strategicValue": 0-5,
  "explanation": "2-3 sentence explanation"
}`,
        `${ctx}\nCompany: ${lead.companyName}, Industry: ${lead.industry}, Size: ${lead.size}`,
        900
      );
      await prisma.leadScore.upsert({
        where: { leadId },
        create: { leadId, ...result },
        update: { ...result },
      });
      await prisma.lead.update({ where: { id: leadId }, data: { score: result.total } });
      await prisma.agentActivity.create({
        data: { leadId, agent: 'Score Agent', action: `Lead scored: ${result.total}/100`, detail: result.explanation?.slice(0, 100) }
      });
      return NextResponse.json({ ok: true, score: result.total, details: result });
    }

    if (agent === 'opportunities') {
      const ctx = research ? `Summary: ${research.summary}\nPain points: ${JSON.stringify(research.painPoints)}\nAngle: ${research.consultingAngle}` : `Company: ${lead.companyName}, Industry: ${lead.industry}`;
      const result = await runAgent(
        `You are an AI consulting strategist. Generate specific consulting opportunities.
Return ONLY valid JSON with exactly 4 opportunities:
{
  "opportunities": [
    {
      "title": "name (5 words max)",
      "problem": "one sentence problem",
      "solution": "one sentence AI solution",
      "value": "one sentence business value",
      "difficulty": 2,
      "timeline": "6-8 weeks",
      "valueLow": 15000,
      "valueHigh": 30000,
      "category": "Automation"
    }
  ]
}
Keep every string under 15 words. Be industry-specific.`,
        `Company: ${lead.companyName}\nIndustry: ${lead.industry}\n${ctx}`,
        2000
      );
      await prisma.opportunity.deleteMany({ where: { leadId } });
      await prisma.opportunity.createMany({ data: result.opportunities.map((o: any) => ({ leadId, ...o })) });
      const total = result.opportunities.reduce((s: number, o: any) => s + (o.valueLow || 0), 0);
      const totalHigh = result.opportunities.reduce((s: number, o: any) => s + (o.valueHigh || 0), 0);
      await prisma.agentActivity.create({
        data: { leadId, agent: 'Opportunity Agent', action: `${result.opportunities.length} opportunities identified`, detail: `Est. value: $${Math.round(total/1000)}K–$${Math.round(totalHigh/1000)}K` }
      });
      return NextResponse.json({ ok: true, opportunities: result.opportunities });
    }

    if (agent === 'outreach') {
      const ctx = research ? `Summary: ${research.summary}\nTop pain: ${(research.painPoints as string[])?.[0] || ''}\nAngle: ${research.consultingAngle}` : `Company: ${lead.companyName}`;
      const contact = lead.contacts[0];
      const result = await runAgent(
        `You write outreach messages for an AI consultant. Return ONLY valid JSON.
Rules: Specific pain point opening. Reference something real about the company. Under 120 words email, 60 words LinkedIn. No hype, no "leverage/transform". One CTA: 15-min call.
Never use em-dashes or en-dashes (— or –); they read as AI-written. Use a comma or semicolon instead. Regular hyphens in compound words (e.g. "AI-powered") are fine.
{
  "shortEmail": { "subject": "subject", "body": "body" },
  "linkedin": { "body": "body" },
  "executive": { "subject": "subject", "body": "body" }
}`,
        `Company: ${lead.companyName}
Contact: ${contact?.name || 'decision maker'}, ${contact?.title || ''}
Industry: ${lead.industry}
${ctx}
My background: AI consulting for logistics/trade/distribution, C# and Azure specialist`,
        1500
      );
      await prisma.outreachMessage.deleteMany({ where: { leadId } });
      const msgs = [
        { leadId, type: 'shortEmail', subject: stripEmphasisDashes(result.shortEmail?.subject), body: stripEmphasisDashes(result.shortEmail?.body || '') },
        { leadId, type: 'linkedin', subject: null, body: stripEmphasisDashes(result.linkedin?.body || '') },
        { leadId, type: 'executive', subject: stripEmphasisDashes(result.executive?.subject), body: stripEmphasisDashes(result.executive?.body || '') },
      ];
      await prisma.outreachMessage.createMany({ data: msgs });
      await prisma.lead.update({ where: { id: leadId }, data: { status: ['Researching','Qualified'].includes(lead.status) ? 'Outreach Ready' : lead.status } });
      await prisma.agentActivity.create({
        data: { leadId, agent: 'Outreach Agent', action: 'Outreach messages generated', detail: '3 variants: short email, LinkedIn, executive' }
      });
      return NextResponse.json({ ok: true, messages: result });
    }

    if (agent === 'callprep') {
      const ctx = research ? `Summary: ${research.summary}\nPain points: ${JSON.stringify((research.painPoints as string[])?.slice(0,3))}\nAngle: ${research.consultingAngle}` : `Company: ${lead.companyName}`;
      const contact = lead.contacts[0];
      const result = await runAgent(
        `You prepare discovery call briefs. Return ONLY valid JSON, no markdown.
{
  "opening": "one sentence opening",
  "questions": ["q1","q2","q3","q4","q5"],
  "objections": [
    {"objection": "short phrase","response": "one sentence"},
    {"objection": "short phrase","response": "one sentence"},
    {"objection": "short phrase","response": "one sentence"}
  ],
  "demoIdea": "one sentence specific demo idea",
  "nextStep": "one sentence next step"
}
Keep all strings under 25 words.`,
        `Company: ${lead.companyName}\nContact: ${contact?.name || ''}, ${contact?.title || ''}\nIndustry: ${lead.industry}\n${ctx}`,
        1800
      );
      await prisma.discoveryCallPrep.upsert({
        where: { leadId },
        create: { leadId, ...result, questions: result.questions, objections: result.objections },
        update: { ...result, questions: result.questions, objections: result.objections },
      });
      await prisma.agentActivity.create({
        data: { leadId, agent: 'Call Prep Agent', action: 'Discovery call prep generated', detail: 'Opening, 5 questions, 3 objections, demo idea' }
      });
      return NextResponse.json({ ok: true, data: result });
    }

    return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
