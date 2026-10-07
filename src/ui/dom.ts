// Tiny DOM helpers — no framework needed.

type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs | null, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k === 'class') el.className = String(v);
      else if (k === 'style') el.setAttribute('style', String(v));
      else if (k === 'html') el.innerHTML = String(v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el: HTMLElement, children: (Child | Child[])[]): void {
  for (const c of children) {
    if (Array.isArray(c)) append(el, c);
    else if (c === null || c === undefined || c === false) continue;
    else el.append(c instanceof Node ? c : String(c));
  }
}

export const svgIcon = (paths: string, size = 20): HTMLElement => {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  return span;
};

export const ICONS = {
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
  muted: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  retry: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
};

export function stars(n: number, total = 3): HTMLElement {
  const wrap = h('span', { class: 'stars', 'aria-label': `${n}/${total}` });
  for (let i = 0; i < total; i++) {
    const s = svgIcon(ICONS.star, 18);
    s.classList.add(i < n ? 'on' : 'off');
    wrap.append(s);
  }
  return wrap;
}

/** Simple modal dialog. Returns a close function. */
export function modal(content: HTMLElement, opts: { onClose?: () => void; dismissable?: boolean } = {}): () => void {
  const prevFocus = document.activeElement as HTMLElement | null;
  const backdrop = h('div', { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'modal' }, content));
  const close = () => {
    backdrop.remove();
    window.removeEventListener('keydown', onKey, true);
    opts.onClose?.();
    prevFocus?.focus?.();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && opts.dismissable !== false) { e.stopPropagation(); close(); } };
  if (opts.dismissable !== false) backdrop.addEventListener('pointerdown', (e) => { if (e.target === backdrop) close(); });
  window.addEventListener('keydown', onKey, true);
  document.body.append(backdrop);
  (backdrop.querySelector('button') as HTMLElement | null)?.focus();
  return close;
}

export const fmtScore = (n: number): string => n.toLocaleString('en-US');
export const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
