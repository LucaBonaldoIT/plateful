// 13 — Disclaimer, Terms and Privacy (FR-LEGAL-1). The texts come straight from the
// appendices of docs/REQUIREMENTS.md, so the app and the spec can't drift apart.
import { Fragment, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import requirements from '../../../docs/REQUIREMENTS.md?raw';
import { Overline } from '../components/ui';

const DOCS = {
  disclaimer: { heading: 'Appendix A — Disclaimer', title: 'Disclaimer' },
  terms: { heading: 'Appendix B — Terms of Service', title: 'Terms of Service' },
  privacy: { heading: 'Appendix C — Privacy Policy', title: 'Privacy Policy' },
} as const;

function section(heading: string): string {
  const start = requirements.indexOf(`## ${heading}`);
  if (start < 0) return '';
  const rest = requirements.slice(start + heading.length + 3);
  const end = rest.search(/\n## /);
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(https?:\/\/[^\s)]+)|([\w.+-]+@[\w-]+\.[\w.]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = i++;
    if (m[1]) out.push(<strong key={k}>{inline(m[1])}</strong>);
    else if (m[2]) out.push(<em key={k}>{m[2]}</em>);
    else if (m[3]) out.push(<code key={k}>{m[3]}</code>);
    else if (m[4]) out.push(<a key={k} href={m[4]} target="_blank" rel="noreferrer">{m[4].replace(/^https?:\/\//, '')}</a>);
    else if (m[5]) out.push(<a key={k} href={`mailto:${m[5].replace(/\.$/, '')}`}>{m[5]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs and numbered lists, with indented continuation lines. */
function render(md: string): ReactNode {
  const blocks: { type: 'p' | 'li'; text: string }[] = [];
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { blocks.push({ type: 'p', text: '' }); continue; }
    const li = line.match(/^\d+\.\s+(.*)$/);
    const prev = blocks[blocks.length - 1];
    if (li) blocks.push({ type: 'li', text: li[1]! });
    else if (prev && prev.text && /^\s{2,}/.test(raw)) prev.text += ' ' + line.trim();
    else if (prev && prev.type === 'p' && prev.text) prev.text += ' ' + line.trim();
    else blocks.push({ type: 'p', text: line.trim() });
  }
  const nodes: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => { if (list.length) { nodes.push(<ol key={nodes.length} className="pf-legal__list">{list}</ol>); list = []; } };
  blocks.forEach((b, i) => {
    if (!b.text) return;
    if (b.type === 'li') list.push(<li key={i}>{inline(b.text)}</li>);
    else { flush(); nodes.push(<p key={i}>{inline(b.text)}</p>); }
  });
  flush();
  return <>{nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

export default function Legal() {
  const { doc } = useParams();
  const meta = DOCS[doc as keyof typeof DOCS];
  if (!meta) return <Navigate to="/legal/privacy" replace />;
  const body = section(meta.heading);
  const updated = body.match(/^\*Last updated: (.+)\*/m)?.[1];
  return (
    <main id="main" className="pf-page pf-page--narrow pf-legal">
      <nav className="pf-row pf-wrap pf-gap-16 pf-sm" aria-label="Legal documents">
        {Object.entries(DOCS).map(([k, d]) => (
          <Link key={k} to={`/legal/${k}`} aria-current={k === doc ? 'page' : undefined} className={k === doc ? 'pf-strong' : ''}>
            {d.title}
          </Link>
        ))}
      </nav>
      {updated && <Overline>Last updated {updated}</Overline>}
      <h1 className="pf-h1">{meta.title}</h1>
      {render(body.replace(/^\*Last updated: .+\*\s*/m, ''))}
    </main>
  );
}
