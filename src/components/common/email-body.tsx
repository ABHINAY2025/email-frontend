import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Renders email HTML inside a fully sandboxed iframe (sandbox="" — no scripts, no same-origin,
 * no forms, no top navigation). Because sandbox="" makes the frame cross-origin, its height can't
 * be read; instead an inert, attribute-stripped copy is laid out in a hidden shadow root to
 * measure the height. Plain-text emails render in a pre-wrap block.
 */
export function EmailBody({
  html,
  text,
  className,
  maxHeight,
}: {
  html: string | null | undefined;
  text: string | null | undefined;
  className?: string;
  maxHeight?: number;
}) {
  const { resolved } = useTheme();

  if (html && html.trim()) return <HtmlFrame html={html} dark={resolved === 'dark'} className={className} maxHeight={maxHeight} />;
  if (text && text.trim())
    return (
      <pre className={cn('whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-foreground/90', className)}>
        {text}
      </pre>
    );
  return <p className={cn('text-xs italic text-subtle', className)}>This email has no body content.</p>;
}

function buildDoc(html: string, dark: boolean) {
  const fg = dark ? '#e3e4e7' : '#1a1b1f';
  const muted = dark ? '#9a9ea7' : '#5c606a';
  const link = dark ? '#8e98ea' : '#3f4bbf';
  const border = dark ? '#2a2c32' : '#e3e4e8';
  return `<!doctype html><html><head><meta charset="utf-8">
<base target="_blank">
<meta name="color-scheme" content="${dark ? 'dark' : 'light'}">
<style>
  html,body{margin:0;padding:0;background:transparent;}
  body{font:13px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:${fg};word-wrap:break-word;overflow-wrap:anywhere;padding:2px 2px 8px;}
  a{color:${link};}
  img{max-width:100%;height:auto;}
  table{max-width:100%;border-collapse:collapse;}
  td,th{${dark ? 'color:inherit !important;' : ''}}
  blockquote{margin:8px 0;padding-left:10px;border-left:2px solid ${border};color:${muted};}
  pre{white-space:pre-wrap;}
  hr{border:0;border-top:1px solid ${border};}
  ${dark ? '*{background-color:transparent !important;} font,span,p,div,td{color:inherit !important;}' : ''}
</style></head><body>${html}</body></html>`;
}

const MEASURE_CSS =
  ':host{all:initial;display:block;font:13px/1.6 Inter,ui-sans-serif,system-ui,sans-serif;word-wrap:break-word;overflow-wrap:anywhere;padding:2px 2px 8px}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}';

const BLOCKED_TAGS = 'script,iframe,frame,frameset,object,embed,link,meta,base,form,input,button,textarea,select,video,audio,source,svg,math,template';

/**
 * Build an inert, layout-only copy of the email for height measurement. Parsed with DOMParser
 * (never executes), then stripped of active elements, every attribute except a small layout
 * allow-list, and all resource URLs — so nothing runs or loads in the host document.
 */
function inertCopy(html: string): Node[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(BLOCKED_TAGS).forEach((n) => n.remove());
  const keep = new Set(['width', 'height', 'colspan', 'rowspan', 'align', 'valign', 'cellpadding', 'cellspacing']);
  doc.body.querySelectorAll('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      if (!keep.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
    }
    if (node.tagName === 'IMG') {
      const w = node.getAttribute('width');
      const h = node.getAttribute('height');
      if (w && h) node.setAttribute('style', `width:${parseInt(w, 10) || 0}px;height:${parseInt(h, 10) || 0}px;max-width:100%`);
    }
  });
  const style = document.createElement('style');
  style.textContent = MEASURE_CSS;
  const wrap = document.createElement('div');
  wrap.append(...Array.from(doc.body.childNodes).map((n) => document.importNode(n, true)));
  return [style, wrap];
}

function HtmlFrame({ html, dark, className, maxHeight }: { html: string; dark: boolean; className?: string; maxHeight?: number }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(120);
  const doc = useMemo(() => buildDoc(html, dark), [html, dark]);

  // Measure an inert copy (no scripts can exist — server sanitizes, and we strip any anyway)
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const shadow = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    shadow.replaceChildren(...inertCopy(html));
    const measure = () => setHeight(Math.max(60, Math.ceil(el.getBoundingClientRect().height) + 24));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div className={cn('relative', className)}>
      <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0 -z-10" />
      <iframe
        title="Email content"
        sandbox=""
        srcDoc={doc}
        className="block w-full border-0 bg-transparent"
        style={{ height: maxHeight ? Math.min(height, maxHeight) : height, colorScheme: dark ? 'dark' : 'light' }}
        scrolling={maxHeight && height > maxHeight ? 'yes' : 'no'}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}
