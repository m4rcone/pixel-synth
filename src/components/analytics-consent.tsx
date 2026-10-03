"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

type Consent = "granted" | "denied";

const STORAGE_KEY = "pixelsynth:analytics-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/* A tiny store: the saved choice (localStorage, with an in-memory fallback
   when storage is blocked) and whether the settings were reopened. */
const listeners = new Set<() => void>();
let memoryConsent: Consent | null = null;
let settingsOpen = false;
let returnFocus: HTMLElement | null = null;

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    // Storage blocked: fall back to this page view's choice.
  }
  return memoryConsent;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const getSnapshot = () =>
  `${readConsent() ?? "unset"}:${settingsOpen ? "open" : "closed"}`;
// Nothing renders on the server: the choice only exists in the browser.
const getServerSnapshot = () => "pending";

/** Reopens the banner, e.g. from the footer; focus returns to `trigger`. */
export function openConsentSettings(trigger?: HTMLElement) {
  returnFocus = trigger ?? null;
  settingsOpen = true;
  emit();
}

/** Deletes the `_ga` cookies on this host and its parent domain. */
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!name.startsWith("_ga")) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

function choose(consent: Consent) {
  memoryConsent = consent;
  try {
    localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Kept in memory for this page view.
  }
  // GA may already be running (the choice was changed from the settings).
  const disableKey = `ga-disable-${GA_MEASUREMENT_ID}`;
  if (consent === "denied") {
    (window as unknown as Record<string, unknown>)[disableKey] = true;
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    clearAnalyticsCookies();
  } else {
    (window as unknown as Record<string, unknown>)[disableKey] = false;
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
  }
  settingsOpen = false;
  returnFocus?.focus();
  returnFocus = null;
  emit();
}

/**
 * Loads Google Analytics only after the visitor accepts, and asks once with a
 * non-blocking banner (decline is as easy as accept). Ad storage stays denied.
 */
export function AnalyticsConsent() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (snapshot === "pending") return null;
  const [consent, open] = snapshot.split(":");

  return (
    <>
      {consent === "granted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted'
});
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
      {(consent === "unset" || open === "open") && (
        <ConsentBanner reopened={open === "open"} />
      )}
    </>
  );
}

function ConsentBanner({ reopened }: { reopened: boolean }) {
  const firstButton = useRef<HTMLButtonElement>(null);

  // Opened on request (not on page load): take focus to the choice.
  useEffect(() => {
    if (reopened) firstButton.current?.focus();
  }, [reopened]);

  return (
    <section
      aria-label="Analytics cookies"
      className="border-line-strong bg-ink-raised fixed inset-x-4 bottom-4 z-50 flex flex-col gap-4 border p-4 sm:left-auto sm:max-w-sm"
    >
      <p className="text-paper text-sm leading-relaxed">
        PixelSynth uses Google Analytics cookies to count visits and see which
        pages are used. Your images never leave your device either way.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          ref={firstButton}
          size="sm"
          variant="outline"
          onClick={() => choose("denied")}
        >
          Decline
        </Button>
        <Button size="sm" variant="outline" onClick={() => choose("granted")}>
          Accept
        </Button>
      </div>
    </section>
  );
}

/** Footer control that reopens the banner. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => openConsentSettings(event.currentTarget)}
    >
      Cookie settings
    </button>
  );
}
