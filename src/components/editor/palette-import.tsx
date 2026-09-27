"use client";

import { useRef, useState } from "react";
import {
  PALETTE_FILE_TYPES,
  parsePalette,
  type PaletteImport as Imported,
} from "@/lib/palette-import";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Palette files are a few KB; anything this large is something else. */
const MAX_FILE_BYTES = 256 * 1024;

type Success = Extract<Imported, { ok: true }>;

/**
 * Imports a palette pasted as text or opened from a file (Lospec's HEX, GPL,
 * PAL and Paint.NET TXT downloads, or any list of hex codes).
 */
export function PaletteImport({
  disabled,
  onImport,
}: {
  disabled: boolean;
  onImport: (palette: Success) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function apply(source: string) {
    const result = parsePalette(source);
    if (!result.ok) return setError(result.error);
    onImport(result);
    setText("");
    setOpen(false);
  }

  async function openFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      return setError("That file is too large to be a palette.");
    }
    try {
      apply(await file.text());
    } catch {
      setError("Couldn’t read that file.");
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setError(null);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          Import
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        aria-labelledby="palette-import-title"
        className="w-80"
      >
        <form
          className="flex flex-col gap-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            apply(text);
          }}
        >
          <div className="flex flex-col gap-1">
            <h2 id="palette-import-title" className="text-lg font-semibold">
              Import a palette
            </h2>
            <p id="palette-import-hint" className="text-paper-dim text-hint">
              Paste hex codes, or open a palette file. Lospec’s HEX, GPL, PAL
              and Paint.NET TXT downloads all work. The colors replace your
              custom palette.
            </p>
          </div>
          <label htmlFor="palette-import-text" className="sr-only">
            Colors
          </label>
          <textarea
            id="palette-import-text"
            rows={5}
            value={text}
            spellCheck={false}
            placeholder={"#1a1c2c\n#5d275d\n#b13e53"}
            aria-describedby="palette-import-hint"
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            className="border-input bg-ink-sunken text-readout text-paper placeholder:text-paper-dim focus-visible:ring-safelight aria-invalid:border-safelight w-full resize-y border px-2 py-1.5 focus-visible:ring-2 focus-visible:outline-none"
          />
          {error && (
            <p role="alert" className="text-danger text-xs leading-relaxed">
              {error}
            </p>
          )}
          <input
            ref={fileInput}
            type="file"
            accept={PALETTE_FILE_TYPES}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={(event) => {
              void openFile(event.target.files?.[0]);
              // Let the same file be chosen again after a fix.
              event.target.value = "";
            }}
          />
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
            >
              Open file
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              Import colors
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
