'use client';

import { useEffect, useRef } from 'react';
import { AppLanguage, getLocalizedMap } from '../lib/i18n';

const ATTRS = ['placeholder', 'title', 'aria-label'] as const;

function replaceTrimmed(original: string, translated: string) {
  if (original === translated) return original;
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  const core = original.trim();
  if (!core) return original;
  return `${leading}${translated}${trailing}`;
}

function localizeTextNode(
  node: Node,
  language: AppLanguage,
  map: Record<string, string>,
  originalTextMap: WeakMap<Node, string>,
) {
  const current = node.nodeValue ?? '';
  if (!current) return;

  if (language === 'en') {
    const original = originalTextMap.get(node);
    if (original !== undefined && current !== original) {
      node.nodeValue = original;
    }
    return;
  }

  const original = originalTextMap.get(node) ?? current;
  if (!originalTextMap.has(node)) {
    originalTextMap.set(node, current);
  }

  const key = original.trim();
  if (!key) return;
  const translated = map[key];
  if (translated && translated !== key) {
    node.nodeValue = replaceTrimmed(original, translated);
  }
}

function localizeElementAttrs(
  el: Element,
  language: AppLanguage,
  map: Record<string, string>,
  originalAttrMap: WeakMap<Element, Record<string, string>>,
) {
  if (language === 'en') {
    const stored = originalAttrMap.get(el);
    if (!stored) return;
    for (const attr of ATTRS) {
      const original = stored[attr];
      if (original !== undefined) {
        el.setAttribute(attr, original);
      }
    }
    return;
  }

  const stored = originalAttrMap.get(el) ?? {};
  let changed = false;
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    if (stored[attr] === undefined) {
      stored[attr] = value;
      changed = true;
    }
    const key = stored[attr].trim();
    const translated = key ? map[key] : undefined;
    if (translated && translated !== key) {
      el.setAttribute(attr, replaceTrimmed(stored[attr], translated));
    }
  }
  if (changed) {
    originalAttrMap.set(el, stored);
  }
}

function localizeRoot(
  root: Node,
  language: AppLanguage,
  map: Record<string, string>,
  originalTextMap: WeakMap<Node, string>,
  originalAttrMap: WeakMap<Element, Record<string, string>>,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    localizeTextNode(node, language, map, originalTextMap);
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    const elements = [root, ...Array.from(root.querySelectorAll('*'))];
    for (const el of elements) {
      localizeElementAttrs(el, language, map, originalAttrMap);
    }
  }
}

export function AutoLocalize({ language }: { language: AppLanguage }) {
  const originalTextMapRef = useRef(new WeakMap<Node, string>());
  const originalAttrMapRef = useRef(new WeakMap<Element, Record<string, string>>());

  useEffect(() => {
    const map = getLocalizedMap(language);
    const originalTextMap = originalTextMapRef.current;
    const originalAttrMap = originalAttrMapRef.current;

    localizeRoot(document.body, language, map, originalTextMap, originalAttrMap);

    if (language === 'en') return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.nodeValue) {
          localizeTextNode(mutation.target, language, map, originalTextMap);
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            localizeRoot(node, language, map, originalTextMap, originalAttrMap);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}
