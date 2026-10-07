// Optional advertising placement — DISABLED by default.
//
// Pianito is 100% free. If you ever want to fund hosting with a single unobtrusive ad,
// set `enabled: true` and provide your provider's script URL and slot markup below.
// Rules enforced by the app:
//   • The slot only renders on menu screens, never during gameplay or over the piano.
//   • No ad script is loaded unless `enabled` is true AND `scriptSrc` is set.
import { h } from './ui/dom';

export const ADS = {
  enabled: false,
  /** e.g. 'https://example-ad-network.com/loader.js' */
  scriptSrc: '',
  /** Attributes your provider requires on the slot element. */
  slotAttributes: {} as Record<string, string>,
};

let scriptLoaded = false;

export function renderAdSlot(): HTMLElement | null {
  if (!ADS.enabled) return null;
  const slot = h('aside', { class: 'ad-slot', 'aria-label': 'Advertisement', ...ADS.slotAttributes });
  if (ADS.scriptSrc && !scriptLoaded) {
    scriptLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = ADS.scriptSrc;
    document.head.append(s);
  }
  return slot;
}
