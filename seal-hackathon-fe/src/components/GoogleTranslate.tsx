"use client";

import { useEffect } from "react";
import { getSavedTranslateLanguage, persistTranslateLanguage } from "@/lib/googleTranslate";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (options: { pageLanguage: string; autoDisplay?: boolean }, element: string) => unknown;
      };
    };
    googleTranslateElementInit?: () => void;
    __sealGoogleTranslateReady?: boolean;
    __sealGoogleTranslateDomPatched?: boolean;
  }
}

const CONTAINER_ID = "google_translate_element";
const SCRIPT_ID = "google-translate-script";
const SOURCE_LANGUAGE = "en";

function patchDomMutationMethods() {
  if (window.__sealGoogleTranslateDomPatched) return;

  const nodePrototype = window.Node.prototype;
  const originalRemoveChild = nodePrototype.removeChild;
  const originalInsertBefore = nodePrototype.insertBefore;

  nodePrototype.removeChild = function safeRemoveChild<T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  nodePrototype.insertBefore = function safeInsertBefore<T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }

    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  window.__sealGoogleTranslateDomPatched = true;
}

function ensureTranslateContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (container) return container;

  container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.opacity = "0";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  return container;
}

function applySelectedLanguage(language: string) {
  if (language === SOURCE_LANGUAGE) return;

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select || select.value === language) return;

  select.value = language;
  select.dispatchEvent(new Event("change"));
}

export default function GoogleTranslate() {
  useEffect(() => {
    patchDomMutationMethods();

    const language = getSavedTranslateLanguage();
    persistTranslateLanguage(language);
    document.documentElement.lang = language;
    ensureTranslateContainer();

    window.googleTranslateElementInit = () => {
      if (window.__sealGoogleTranslateReady) return;

      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;

      new TranslateElement(
        {
          pageLanguage: SOURCE_LANGUAGE,
          autoDisplay: false,
        },
        CONTAINER_ID,
      );

      window.__sealGoogleTranslateReady = true;
      window.setTimeout(() => applySelectedLanguage(language), 300);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}

