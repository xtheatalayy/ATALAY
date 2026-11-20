'use client';

import { useEffect } from 'react';
import { DEFAULT_LOCALE } from '@/lib/i18n/languages';
import { useLocale } from './language-provider';

const BRAND = 'Planned Life';
const BRAND_TOKEN = 'PLNDLFBRND';
const CACHE_VERSION = 'v1';
const MAX_CACHE_ENTRIES = 5000;
const MAX_TEXT_LENGTH = 1000;
const CONCURRENCY = 4;
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;

type Cache = Record<string, string>;

function cacheKey(locale: string) {
  return `pl_i18n_${CACHE_VERSION}_${locale}`;
}

function loadCache(locale: string): Cache {
  try {
    const raw = window.localStorage.getItem(cacheKey(locale));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Cache) : {};
  } catch {
    return {};
  }
}

function persistCache(locale: string, cache: Cache) {
  try {
    const entries = Object.entries(cache);
    const trimmed =
      entries.length > MAX_CACHE_ENTRIES
        ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
        : cache;
    window.localStorage.setItem(cacheKey(locale), JSON.stringify(trimmed));
  } catch {
    // storage full or unavailable
  }
}

async function requestTranslation(text: string, locale: string): Promise<string | null> {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto' +
    `&tl=${encodeURIComponent(locale)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  const segments = Array.isArray(data) ? data[0] : null;
  if (!Array.isArray(segments)) return null;
  const out = segments.map((seg) => (Array.isArray(seg) ? (seg[0] as string) : '')).join('');
  return out.trim() ? out : null;
}

function makeTranslator(locale: string) {
  const cache = loadCache(locale);
  const pending = new Map<string, Promise<string | null>>();
  const queue: Array<() => void> = [];
  let active = 0;
  let dirty = false;
  let saveTimer: number | undefined;

  const scheduleSave = () => {
    dirty = true;
    if (saveTimer) return;
    saveTimer = window.setTimeout(() => {
      saveTimer = undefined;
      if (!dirty) return;
      dirty = false;
      persistCache(locale, cache);
    }, 1500);
  };

  const run = async (text: string, resolve: (value: string | null) => void) => {
    active += 1;
    try {
      const out = await requestTranslation(text, locale);
      if (out) {
        cache[text] = out;
        scheduleSave();
      }
      resolve(out);
    } catch {
      resolve(null);
    } finally {
      active -= 1;
      const next = queue.shift();
      if (next) next();
    }
  };

  const translate = (text: string): Promise<string | null> => {
    const cached = cache[text];
    if (cached !== undefined) return Promise.resolve(cached);
    const existing = pending.get(text);
    if (existing) return existing;

    const promise = new Promise<string | null>((resolve) => {
      const start = () => run(text, resolve);
      if (active < CONCURRENCY) start();
      else queue.push(start);
    });
    pending.set(text, promise);
    void promise.finally(() => pending.delete(text));
    return promise;
  };

  const flush = () => {
    if (dirty) {
      dirty = false;
      persistCache(locale, cache);
    }
  };

  return { translate, flush };
}

function isEligible(source: string): boolean {
  const trimmed = source.trim();
  if (trimmed.length < 2 || trimmed.length > MAX_TEXT_LENGTH) return false;
  if (trimmed === BRAND) return false;
  if (!/[\p{L}]/u.test(trimmed)) return false;
  if (/^[\p{Sc}\p{N}\s.,:+\-/%()]+$/u.test(trimmed)) return false;
  return true;
}

function protectBrand(text: string) {
  return text.replace(/planned life/gi, BRAND_TOKEN);
}

function restoreBrand(text: string) {
  return text.split(BRAND_TOKEN).join(BRAND);
}

export function AutoTranslator() {
  const { locale } = useLocale();

  useEffect(() => {
    if (locale === DEFAULT_LOCALE || typeof document === 'undefined') return;

    const { translate, flush } = makeTranslator(locale);
    const originals = new WeakMap<Text, { out: string | null }>();
    const attrOriginals = new WeakMap<Element, Record<string, { out: string | null }>>();
    const titleTracker = new WeakMap<Element, { out: string | null }>();
    let disposed = false;

    const applyText = (node: Text, source: string) => {
      const lead = source.match(/^\s*/)?.[0] ?? '';
      const trail = source.match(/\s*$/)?.[0] ?? '';
      const core = source.slice(lead.length, source.length - trail.length);
      void translate(protectBrand(core)).then((result) => {
        if (!result || disposed || !node.isConnected) return;
        if (node.data !== source) return;
        const out = `${lead}${restoreBrand(result)}${trail}`;
        node.data = out;
        const rec = originals.get(node);
        if (rec) rec.out = out;
      });
    };

    const translateText = (node: Text) => {
      if (!node.isConnected) return;
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.closest('script,style,noscript,code,pre,textarea,[data-no-translate]')) return;

      const text = node.data;
      if (!text.trim() || !isEligible(text)) return;

      const rec = originals.get(node);
      if (rec) {
        if (rec.out !== null && text === rec.out) return;
        if (rec.out === null) return;
      }
      originals.set(node, { out: null });
      applyText(node, text);
    };

    const translateAttrs = (el: Element) => {
      if (el.closest('[data-no-translate]')) return;
      for (const name of ATTRS) {
        const value = el.getAttribute(name);
        if (!value || !value.trim() || !isEligible(value)) continue;
        let store = attrOriginals.get(el);
        if (!store) {
          store = {};
          attrOriginals.set(el, store);
        }
        const rec = store[name];
        if (rec) {
          if (rec.out !== null && value === rec.out) continue;
          if (rec.out === null) continue;
        }
        store[name] = { out: null };
        const source = value;
        void translate(protectBrand(source)).then((result) => {
          if (!result || disposed || !el.isConnected) return;
          if (el.getAttribute(name) !== source) return;
          const out = restoreBrand(result);
          el.setAttribute(name, out);
          const current = attrOriginals.get(el)?.[name];
          if (current) current.out = out;
        });
      }
    };

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateText(root as Text);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const el = root as Element;
      if (el.closest('script,style,noscript,[data-no-translate]')) return;
      translateAttrs(el);
      el.querySelectorAll('*').forEach(translateAttrs);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        translateText(node as Text);
        node = walker.nextNode();
      }
    };

    const translateTitle = () => {
      const titleEl = document.head.querySelector('title');
      const parent = titleEl?.parentElement;
      if (!titleEl || !parent) return;
      const text = titleEl.textContent ?? '';
      if (!text.trim() || !isEligible(text)) return;
      const state = titleTracker.get(titleEl);
      if (state) {
        if (state.out !== null && text === state.out) return;
        if (state.out === null) return;
      }
      titleTracker.set(titleEl, { out: null });
      const lead = text.match(/^\s*/)?.[0] ?? '';
      const trail = text.match(/\s*$/)?.[0] ?? '';
      const core = text.slice(lead.length, text.length - trail.length);
      void translate(protectBrand(core)).then((result) => {
        if (!result || disposed) return;
        const out = `${lead}${restoreBrand(result)}${trail}`;
        const current = document.head.querySelector('title');
        if (!current || (current.textContent ?? '') !== text) return;
        current.textContent = out;
        titleTracker.set(current, { out });
      });
    };

    walk(document.body);
    translateTitle();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateText(mutation.target as Text);
        } else {
          mutation.addedNodes.forEach((node) => walk(node));
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const headObserver = new MutationObserver(() => translateTitle());
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      disposed = true;
      observer.disconnect();
      headObserver.disconnect();
      flush();
    };
  }, [locale]);

  return null;
}
