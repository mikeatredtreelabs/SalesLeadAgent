import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const leads = await prisma.lead.findMany({
    where: { userId },
    include: { contacts: true },
    orderBy: { updatedAt: 'desc' },
  });

  const headers = [
    'Company Name', 'Website', 'Industry', 'Location', 'Size',
    'Status', 'Score', 'Source', 'Contact Name', 'Contact Title',
    'Contact Email', 'Contact LinkedIn', 'Notes', 'Created Date',
  ];

  const rows = leads.map(lead => {
    const contact = lead.contacts[0];
    return [
      lead.companyName,
      lead.website,
      lead.industry,
      lead.location,
      lead.size,
      lead.status,
      lead.score,
      lead.source,
      contact?.name,
      contact?.title,
      contact?.email,
      contact?.linkedin,
      lead.notes,
      lead.createdAt.toISOString().split('T')[0],
    ].map(escapeCSV).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
