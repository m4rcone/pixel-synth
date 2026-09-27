"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { useEditorState } from "@/contexts/editor-context";
import { settingsUrl } from "@/lib/editor/share";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Copies a link that reopens the editor with the current settings. */
export function ShareSettings() {
  const { status } = useEditorState();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Share settings"
          disabled={status === "empty"}
          className="text-paper-dim hover:text-paper hover:bg-accent focus-visible:ring-safelight grid size-9 place-items-center transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45"
        >
          <Link2 className="size-4.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label="Share settings"
        // Start on the copy button, not on the (auto-selecting) link field.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("share-settings-copy")?.focus();
        }}
        className="flex w-80 flex-col gap-3 text-sm"
      >
        <ShareLink />
      </PopoverContent>
    </Popover>
  );
}

/** Rendered only while the popover is open, so the link matches that moment. */
function ShareLink() {
  const { settings, status } = useEditorState();
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  const url = settingsUrl(
    window.location.origin,
    settings,
    status === "dithered",
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("yes");
    } catch {
      setCopied("failed");
      document.getElementById("share-settings-url")?.focus();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-medium">Share these settings</p>
        <p className="text-paper-dim leading-relaxed">
          The link reopens the editor with the same look for any image. It never
          includes your image.
        </p>
      </div>
      <label htmlFor="share-settings-url" className="sr-only">
        Settings link
      </label>
      <input
        id="share-settings-url"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="border-input bg-ink-sunken text-readout text-paper focus-visible:ring-safelight h-9 w-full border px-2 focus-visible:ring-2 focus-visible:outline-none"
      />
      <Button id="share-settings-copy" onClick={copy} className="w-full">
        {copied === "yes" ? "Link copied" : "Copy link"}
      </Button>
      <p aria-live="polite" className="text-label text-paper-dim min-h-4">
        {copied === "yes"
          ? "Link copied to the clipboard."
          : copied === "failed"
            ? "Couldn’t copy automatically. The link is selected: copy it with your keyboard."
            : ""}
      </p>
    </>
  );
}
