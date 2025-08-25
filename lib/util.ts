/* -----------------------------------------------------------------------
 * lib/utils.ts
 * World-class UI utilities with zero external deps.
 * - SSR-safe (guards for window/document)
 * - Strongly typed (TS)
 * - Tailwind-friendly class merging
 * - A11y/DOM helpers (focus trap, scroll lock, in-view)
 * - Hotkeys, timing, formatters, storage, clipboard, etc.
 * --------------------------------------------------------------------- */

import type React from "react";

/* =========================================
   Environment & Primitives
========================================= */
export const isBrowser = typeof window !== "undefined";
export const isServer = !isBrowser;

/** No-op */
export const noop = () => {};

/** Generate compact, collision-resistant IDs (client/server safe). */
export function uid(prefix = "id"): string {
  const r = Math.random().toString(36).slice(2, 8);
  const t = isBrowser ? Date.now().toString(36).slice(-4) : "srv";
  return `${prefix}-${t}-${r}`;
}

/** Assert never (exhaustiveness checks). */
export function assertNever(x: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${String(x)}`);
}

/* =========================================
   Class / Props Utilities
========================================= */

/** Truthy className joiner. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Tailwind-friendly class merger:
 * - Splits by whitespace
 * - Keeps the last occurrence of conflicting utilities
 * - Preserves overall order for predictable overrides
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  const tokens = classes
    .filter(Boolean)
    .flatMap((c) => (c as string).trim().split(/\s+/));
  const lastSeen = new Map<string, number>();
  tokens.forEach((t, i) => lastSeen.set(t, i));
  return tokens.filter((t, i) => lastSeen.get(t) === i).join(" ");
}

/** Compose multiple refs (forwardRef + local ref). */
export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/** Merge two props objects: className via cx, style via spread. */
export function mergeProps<
  A extends { className?: string; style?: React.CSSProperties },
  B extends { className?: string; style?: React.CSSProperties }
>(a: A, b: B): A & B {
  const className = cx(a.className, b.className);
  const style = { ...(a.style || {}), ...(b.style || {}) };
  return { ...(a as object), ...(b as object), className, style } as A & B;
}

/* =========================================
   Numbers, Sizes, Colors
========================================= */
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult = true
): number {
  const pct = (value - inMin) / (inMax - inMin || 1);
  const mapped = outMin + pct * (outMax - outMin);
  return clampResult ? clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax)) : mapped;
}

/** Round to decimal places. */
export const round = (n: number, places = 0) =>
  Number(Math.round(Number(n + "e" + places)) + "e-" + places);

/** px → rem (base 16 by default). Accepts 24 or "24px". */
export function pxToRem(px: number | string, base = 16): string {
  const n = typeof px === "string" ? parseFloat(px) : px;
  const v = n / base;
  return `${parseFloat(v.toFixed(4))}rem`;
}

/** Build a CSS clamp() for fluid sizing. */
export const fluidClamp = (min: string, preferred: string, max: string) => `clamp(${min}, ${preferred}, ${max})`;

/** Parse #rgb/#rrggbb to {r,g,b}. Returns null on invalid. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const s = hex.replace("#", "").trim();
  if (![3, 6].includes(s.length) || /[^a-f0-9]/i.test(s)) return null;
  const norm = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(norm, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Convert rgb to HSL string "h s% l%" (no alpha). */
export function rgbToHslString(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Hex → HSL string (returns null on invalid hex). */
export function hexToHslString(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHslString(rgb.r, rgb.g, rgb.b);
}

/* =========================================
   Strings, Arrays, Objects
========================================= */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function uniqueBy<T>(arr: T[], key: (t: T) => string | number): T[] {
  const map = new Map<string | number, T>();
  arr.forEach((item) => map.set(key(item), item));
  return Array.from(map.values());
}

export const range = (n: number, start = 0) => Array.from({ length: n }, (_, i) => i + start);

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const set = new Set(keys as (keyof T)[]);
  const out = {} as Omit<T, K>;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    if (!set.has(k)) (out as any)[k] = obj[k];
  });
  return out;
}

/** Deep merge (arrays by replace, objects by merge). */
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(a: T, b: U): T & U {
  const out: Record<string, any> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (Array.isArray(v)) out[k] = v.slice();
    else if (v && typeof v === "object") out[k] = deepMerge((a as any)[k] || {}, v);
    else out[k] = v;
  }
  return out as T & U;
}

/* =========================================
   Intl & Formatting
========================================= */
export function formatCurrency(
  value: number,
  opts: Intl.NumberFormatOptions & { locale?: string; currency?: string } = {}
): string {
  const { locale = "en-US", currency = "USD", ...rest } = opts;
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2, ...rest }).format(value);
}

export function formatNumberCompact(value: number, locale = "en-US", fraction = 1): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: fraction }).format(value);
}

export function formatDate(
  date: Date | string | number,
  locale = "en-US",
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

/** "3 minutes ago", "yesterday", etc. */
export function timeAgo(date: Date | string | number, locale = "en"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const map: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "second";
  let value = -Math.round(diff);
  let acc = 1;
  for (const [step, u] of map) {
    if (Math.abs(value / acc) < step) { unit = u; value = Math.round(value / acc); break; }
    acc *= step;
  }
  return rtf.format(value, unit);
}

export function listFormat(
  items: Iterable<string>,
  locale = "en",
  type: Intl.ListFormatType = "conjunction",
  style: Intl.ListFormatStyle = "short"
) {
  return new Intl.ListFormat(locale, { type, style }).format(Array.from(items));
}

/* =========================================
   Storage & JSON (safe)
========================================= */
export const storage = {
  get(key: string): string | null {
    try { return isBrowser ? window.localStorage.getItem(key) : null; } catch { return null; }
  },
  set(key: string, value: string) {
    try { if (isBrowser) window.localStorage.setItem(key, value); } catch {}
  },
  remove(key: string) {
    try { if (isBrowser) window.localStorage.removeItem(key); } catch {}
  },
};

export const json = {
  parse<T>(s: string | null, fallback: T): T {
    if (!s) return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
  },
  stringify<T>(v: T, fallback = ""): string {
    try { return JSON.stringify(v); } catch { return fallback; }
  },
};

/* =========================================
   Clipboard & Selection
========================================= */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  // Fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* =========================================
   CSS Variables
========================================= */
export function readCssVar(name: string): string | null {
  if (!isBrowser) return null;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || null;
}
export function setCssVar(name: string, value: string): void {
  if (!isBrowser) return;
  document.documentElement.style.setProperty(name, value);
}

/* =========================================
   A11y & Focus
========================================= */
/** Focus element; if not focusable, temporarily add tabindex for a11y. */
export function smartFocus(el: HTMLElement | null, opts: FocusOptions = { preventScroll: true }) {
  if (!isBrowser || !el) return;
  const had = el.hasAttribute("tabindex");
  if (!had) el.setAttribute("tabindex", "-1");
  el.focus(opts);
  if (!had) el.removeAttribute("tabindex");
}

/** Get focusable descendants within a container. */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selector));
  return nodes.filter((n) => !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length));
}

/** Trap focus within a container; returns cleanup. */
export function createFocusTrap(container: HTMLElement) {
  if (!isBrowser) return () => {};
  const focusables = () => getFocusable(container);
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const list = focusables();
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && active === last) {
      first.focus(); e.preventDefault();
    }
  }
  container.addEventListener("keydown", onKeydown);
  return () => container.removeEventListener("keydown", onKeydown);
}

/** Lock body scroll (for modals/drawers). Returns cleanup. */
export function lockBodyScroll(): () => void {
  if (!isBrowser) return () => {};
  const { body } = document;
  const prevOverflow = body.style.overflow;
  const prevPaddingRight = body.style.paddingRight;
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = "hidden";
  if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
  return () => {
    body.style.overflow = prevOverflow;
    body.style.paddingRight = prevPaddingRight;
  };
}

/* =========================================
   Observers & Timing
========================================= */
export function inView(
  el: Element,
  options: IntersectionObserverInit,
  cb: (entry: IntersectionObserverEntry) => void
): () => void {
  if (!isBrowser || !("IntersectionObserver" in window)) return noop;
  const io = new IntersectionObserver((entries) => entries.forEach(cb), options);
  io.observe(el);
  return () => io.disconnect();
}

/** Run on next animation frame. Returns cancel function. */
export function nextFrame(fn: () => void): () => void {
  if (!isBrowser) return () => {};
  const id = requestAnimationFrame(fn);
  return () => cancelAnimationFrame(id);
}

/** Microtask tick (Promise). */
export const nextTick = () => Promise.resolve();

/** Debounce helper. */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 150) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/** Throttle helper (leading). */
export function throttle<T extends (...args: any[]) => void>(fn: T, limit = 150) {
  let waiting = false;
  return (...args: Parameters<T>) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => (waiting = false), limit);
  };
}

/* =========================================
   Keyboard / Hotkeys
========================================= */
export type Hotkey =
  | "ctrl"
  | "shift"
  | "alt"
  | "meta"
  | "cmd"
  | "mod"
  | string;

function normalizeHotkey(h: string): string[] {
  return h
    .toLowerCase()
    .split("+")
    .map((s) => s.trim());
}

/** Check if a KeyboardEvent matches a hotkey string like "cmd+k" or "ctrl+shift+p". */
export function isHotkey(e: KeyboardEvent, combo: string): boolean {
  const parts = normalizeHotkey(combo);
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  const isMac = isBrowser ? /Mac|iPod|iPhone|iPad/.test(navigator.platform) : false;

  const needCtrl = mods.has("ctrl") || (mods.has("mod") && !isMac);
  const needMeta = mods.has("meta") || mods.has("cmd") || (mods.has("mod") && isMac);
  const needAlt = mods.has("alt");
  const needShift = mods.has("shift");

  const keyOk = e.key.toLowerCase() === key;
  const ctrlOk = !!e.ctrlKey === needCtrl;
  const metaOk = !!e.metaKey === needMeta;
  const altOk = !!e.altKey === needAlt;
  const shiftOk = !!e.shiftKey === needShift;

  return keyOk && ctrlOk && metaOk && altOk && shiftOk;
}

/* =========================================
   Feature Flags & Preferences
========================================= */
export function prefersReducedMotion(): boolean {
  if (!isBrowser || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function prefersLight(): boolean {
  if (!isBrowser || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

/* =========================================
   Query String Helpers
========================================= */
export function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  return usp.toString();
}

export function fromQuery(search: string): Record<string, string> {
  const usp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Record<string, string> = {};
  usp.forEach((v, k) => (out[k] = v));
  return out;
}

/* =========================================
   Tiny Emitter
========================================= */
export type Listener<T> = (payload: T) => void;

export function createEmitter<T = void>() {
  const listeners = new Set<Listener<T>>();
  return {
    on(l: Listener<T>) { listeners.add(l); return () => listeners.delete(l); },
    once(l: Listener<T>) {
      const off = this.on((p) => { off(); l(p); });
      return off;
    },
    emit(payload: T) { listeners.forEach((l) => l(payload)); },
    clear() { listeners.clear(); },
    count() { return listeners.size; },
  };
}

/* =========================================
   Example: Theme Preference
========================================= */
const THEME_KEY = "theme";
export type ThemeMode = "light" | "dark";

export function getStoredTheme(): ThemeMode | null {
  return storage.get(THEME_KEY) as ThemeMode | null;
}
export function setStoredTheme(mode: ThemeMode) {
  storage.set(THEME_KEY, mode);
}
export function resolveInitialTheme(): ThemeMode {
  const stored = getStoredTheme();
  if (stored) return stored;
  return prefersLight() ? "light" : "dark";
}
