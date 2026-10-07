// Application shell: services, routing, header, and sound for menu-screen key presses.
import { AudioEngine, type Voice } from '../audio/engine';
import { InputManager } from '../input/input';
import { SettingsStore, type Settings } from '../core/settings';
import { Progress, safeStorage } from '../core/progress';
import { loadLayoutLabels } from '../core/keymap';
import { setLang, t } from '../i18n';
import { h, svgIcon, ICONS } from './dom';
import { renderAdSlot } from '../config';

export type Route =
  | { name: 'home' }
  | { name: 'learn' }
  | { name: 'lesson'; id: string }
  | { name: 'play'; id: string; mode: 'lesson' | 'arcade'; hard?: boolean; rate?: number }
  | { name: 'arcade' }
  | { name: 'free' }
  | { name: 'settings' };

export interface Screen {
  el: HTMLElement;
  destroy?(): void;
  /** Screens that play their own note sounds (game, free play). */
  ownsSound?: boolean;
  /** Full-bleed screens hide the header and ad slot. */
  immersive?: boolean;
}

export interface App {
  audio: AudioEngine;
  input: InputManager;
  settings: SettingsStore;
  progress: Progress;
  touchOnly: boolean;
  go(route: Route): void;
  refresh(): void;
}

type ScreenFactory = (app: App, route: Route) => Screen;

export function createApp(root: HTMLElement, screens: Record<Route['name'], ScreenFactory>): App {
  const store = safeStorage();
  const settings = new SettingsStore(store);
  const progress = new Progress(store);
  const audio = new AudioEngine();
  const input = new InputManager();
  input.attach();
  loadLayoutLabels();

  let current: Screen | null = null;
  let route: Route = { name: 'home' };
  const touchOnly = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;

  const applySettings = (s: Settings) => {
    setLang(s.lang);
    audio.setVolumes({ master: s.masterVolume, music: s.musicVolume, metronome: s.metronomeVolume, muted: s.muted });
    document.body.classList.toggle('reduce-motion', settings.reducedMotion());
  };
  applySettings(settings.get());
  settings.subscribe(applySettings);

  // Browsers only allow audio after a user gesture: unlock on the first one.
  const unlock = () => { audio.ensure(); };
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });

  // Menu screens still make sound when you press note keys — the piano is always live.
  const menuVoices = new Map<number, Voice>();
  input.subscribe((e) => {
    if (current?.ownsSound) return;
    if (e.on) {
      menuVoices.get(e.pitch)?.stop();
      menuVoices.set(e.pitch, audio.noteOn(e.pitch, { velocity: 0.8 }));
    } else {
      menuVoices.get(e.pitch)?.stop();
      menuVoices.delete(e.pitch);
    }
  });

  const header = (): HTMLElement => {
    const s = settings.get();
    const nav = (label: string, r: Route) => h('button', { class: `nav-link${route.name === r.name ? ' active' : ''}`, onclick: () => app.go(r) }, label);
    return h('header', { class: 'topbar' },
      h('button', { class: 'logo', onclick: () => app.go({ name: 'home' }), 'aria-label': 'Pianito home' }, logoMark(), h('span', null, 'PIANITO')),
      h('nav', { class: 'nav' },
        nav(t('learn'), { name: 'learn' }),
        nav(t('arcade'), { name: 'arcade' }),
        nav(t('modeFreeTitle'), { name: 'free' }),
      ),
      h('div', { class: 'tools' },
        h('button', { class: 'icon-btn lang', title: t('language'), onclick: () => { settings.set({ lang: s.lang === 'en' ? 'es' : 'en' }); app.refresh(); } }, s.lang === 'en' ? 'ES' : 'EN'),
        h('button', { class: 'icon-btn', title: s.muted ? t('unmute') : t('mute'), 'aria-label': s.muted ? t('unmute') : t('mute'), onclick: () => { settings.set({ muted: !s.muted }); app.refresh(); } }, svgIcon(s.muted ? ICONS.muted : ICONS.sound)),
        h('button', { class: 'icon-btn', title: t('settings'), 'aria-label': t('settings'), onclick: () => app.go({ name: 'settings' }) }, svgIcon(ICONS.gear)),
      ),
    );
  };

  const toHash = (r: Route): string | null => {
    switch (r.name) {
      case 'home': return '#/';
      case 'lesson': return `#/lesson/${r.id}`;
      case 'play': return null; // never deep-link straight into gameplay (needs a gesture for audio)
      default: return `#/${r.name}`;
    }
  };

  const fromHash = (): Route => {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    switch (parts[0]) {
      case 'learn': return { name: 'learn' };
      case 'arcade': return { name: 'arcade' };
      case 'free': return { name: 'free' };
      case 'settings': return { name: 'settings' };
      case 'lesson': return parts[1] ? { name: 'lesson', id: parts[1] } : { name: 'learn' };
      default: return { name: 'home' };
    }
  };

  const render = () => {
    current?.destroy?.();
    input.releaseAll();
    const screen = screens[route.name](app, route);
    current = screen;
    root.replaceChildren();
    if (!screen.immersive) root.append(header());
    root.append(screen.el);
    if (!screen.immersive) {
      const ad = renderAdSlot();
      if (ad) root.append(ad);
    }
    document.body.classList.toggle('immersive', !!screen.immersive);
  };

  const app: App = {
    audio, input, settings, progress, touchOnly,
    go(r) {
      if (touchOnly) setImmersive(r.name === 'play' || r.name === 'free');
      route = r;
      const hash = toHash(r);
      if (hash !== null && hash !== location.hash) history.pushState(null, '', hash || '#/');
      window.scrollTo(0, 0);
      render();
    },
    refresh: render,
  };

  window.addEventListener('popstate', () => { route = fromHash(); render(); });
  route = fromHash();
  render();
  return app;
}

/** Mobile: fullscreen + landscape for gameplay (best effort; iOS Safari has neither API). */
function setImmersive(on: boolean): void {
  const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (on && !(document.fullscreenElement || doc.webkitFullscreenElement)) {
      const p = el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.();
      Promise.resolve(p).then(() => {
        (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {});
      }).catch(() => {});
    } else if (!on && (document.fullscreenElement || doc.webkitFullscreenElement)) {
      (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.()) as unknown;
    }
  } catch { /* unsupported */ }
}

export function logoMark(): HTMLElement {
  const el = h('span', { class: 'logo-mark', 'aria-hidden': 'true' });
  el.innerHTML = '<svg viewBox="0 0 32 32" width="30" height="30"><rect x="1" y="7" width="30" height="24" rx="6" fill="#2a2650"/><rect x="4" y="10" width="7" height="18" rx="2" fill="#fff"/><rect x="12.5" y="10" width="7" height="18" rx="2" fill="#fff"/><rect x="21" y="10" width="7" height="18" rx="2" fill="#fff"/><rect x="9" y="10" width="5" height="10" rx="1.5" fill="#2a2650"/><rect x="18" y="10" width="5" height="10" rx="1.5" fill="#2a2650"/><rect x="5" y="0" width="5" height="6" rx="1.5" fill="#ff4d6d"/><rect x="22" y="1" width="5" height="5" rx="1.5" fill="#ffd23f"/></svg>';
  return el;
}
