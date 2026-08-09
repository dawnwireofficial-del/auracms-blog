// Shared helpers for server-side rendered pages (home, product, category, post).
// These renderers inject semantic HTML (H1, headings, paragraphs, internal
// links) into the SPA shell so crawlers without JavaScript get real content.
// The client React app hydrates over the injected markup.

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function val(row: any, key: string): any {
  if (row == null) return undefined;
  if (row[key] !== undefined && row[key] !== null) return row[key];
  const snake = key.replace(/[A-Z]/g, (c: string) => '_' + c.toLowerCase());
  return row[snake];
}

// Minimal safe markdown -> HTML for editorial posts. HTML in the source is
// escaped first (treats any embedded markup as literal text), then markdown
// constructs are converted. Admin-authored markdown renders headings,
// paragraphs, lists, links, bold/italic, quotes and tables.
export function mdToSimpleHtml(md: string): string {
  const safe = String(md ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let html = safe
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter((c) => c.trim()).map((c) => c.trim());
      if (/^[-:\s]+$/.test(cells.join(''))) return '';
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>');

  const lines = html.split('\n');
  const out: string[] = [];
  let inTable = false;
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inTable) { out.push('</table>'); inTable = false; }
      if (inList) { out.push('</ul>'); inList = false; }
      continue;
    }
    if (line.startsWith('<h') || line.startsWith('<table') || line.startsWith('<ul') || line.startsWith('<pre') || line.startsWith('<blockquote') || line.startsWith('<hr')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line);
      continue;
    }
    if (line.startsWith('</')) {
      out.push(line);
      continue;
    }
    if (line.startsWith('<li>')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(line);
      continue;
    }
    if (line.startsWith('<tr>')) {
      if (!inTable) { out.push('<table>'); inTable = true; }
      out.push(line);
      continue;
    }
    out.push(`<p>${line}</p>`);
  }
  if (inTable) out.push('</table>');
  if (inList) out.push('</ul>');

  return out.join('\n');
}

// Wrap a rendered SSR body in a shared disclosure/SEO footer.
export function ssrFooter(): string {
  return `<footer class="ssr-footer"><p>DawnWire — independent product reviews, buying guides &amp; AI-powered deals.</p>
<p><a href="/">Home</a> &middot; <a href="/products">All product reviews</a> &middot; <a href="/categories">Browse categories</a> &middot; <a href="/guides">Buying guides</a></p></footer>`;
}
