import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeHtml } from './sanitize';

const SLOT_MARK = '<div data-cwb-slot="1" style="height:100%;display:flex;flex-direction:column;"></div>';

/** Render sanitized raw HTML (used for header/sidemenu/footer placeholders). */
export function RawHtml({ html, style }: { html: string; style?: CSSProperties }) {
  const clean = sanitizeHtml(html);
  return <div style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/**
 * Render a sanitized HTML template that contains a `{{content}}` token, and portal
 * `children` (live React, e.g. a chart) into that slot. Lets users style the card
 * chrome with arbitrary HTML while keeping a live chart inside.
 */
export function SlottedHtml({
  html,
  children,
  style,
}: {
  html: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  const withSlot = html.includes('{{content}}')
    ? html.replace('{{content}}', SLOT_MARK)
    : html + SLOT_MARK;
  const clean = sanitizeHtml(withSlot);

  // Set innerHTML manually so React never manages (and never wipes) the slot
  // node we portal live content into.
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = clean;
    setSlot(ref.current.querySelector('[data-cwb-slot]') as HTMLElement | null);
  }, [clean]);

  return (
    <>
      <div ref={ref} style={{ height: '100%', ...style }} />
      {slot && createPortal(children, slot)}
    </>
  );
}
