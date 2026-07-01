// Fetch a company's homepage and reduce it to plain text for the AI agents.
// Best-effort: on any failure (timeout, blocked, non-HTML) it falls back to a
// minimal descriptor so the caller always gets usable input.
export async function fetchSiteText(website: string): Promise<string> {
  const domain = (website || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  if (!domain) return '';
  try {
    const res = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  } catch {
    return `Company website: ${domain}`;
  }
}
