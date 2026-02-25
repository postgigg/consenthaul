// ---------------------------------------------------------------------------
// Regulatory source fetcher — RSS + webpage text extraction
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 15_000;
const MAX_CONTENT_CHARS = 8_000;
const USER_AGENT = 'ConsentHaul-RegScanner/1.0 (+https://consenthaul.com)';

export interface FetchedEntry {
  title: string;
  url: string;
  description: string;
  publishedAt: string | null;
}

// ---------------------------------------------------------------------------
// RSS parsing (regex-based, no XML dependency)
// ---------------------------------------------------------------------------

function parseRSS(xml: string): FetchedEntry[] {
  const entries: FetchedEntry[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() ?? '';
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? '';
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() ?? '';
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? null;

    if (title || link) {
      entries.push({
        title: stripHTML(title),
        url: link,
        description: stripHTML(desc).slice(0, 2000),
        publishedAt: pubDate,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Webpage text extraction
// ---------------------------------------------------------------------------

function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWebpageText(html: string): FetchedEntry {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? 'Untitled Page';
  const text = stripHTML(html).slice(0, MAX_CONTENT_CHARS);

  return {
    title: stripHTML(title),
    url: '',
    description: text,
    publishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Public: fetch entries from a source
// ---------------------------------------------------------------------------

export async function fetchSource(
  url: string,
  sourceType: 'rss' | 'webpage' | 'api',
): Promise<FetchedEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }

    const body = await res.text();

    if (sourceType === 'rss') {
      return parseRSS(body);
    }

    // Webpage / API — return as single entry
    const entry = extractWebpageText(body);
    entry.url = url;
    return [entry];
  } finally {
    clearTimeout(timeout);
  }
}
