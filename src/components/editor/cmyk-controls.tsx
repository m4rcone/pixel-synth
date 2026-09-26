"use client";

import { useEditorActions, useEditorState } from "@/contexts/editor-context";
import { getAlgorithm } from "@/lib/algorithms";
import { inkAngle, INKS } from "@/lib/editor/cmyk";
import { DEFAULT_SETTINGS } from "@/lib/editor/settings";
import { SliderField } from "./slider-field";

/**
 * The CMYK color mode: the four process inks (with their screen angles when
 * a halftone screen is selected) and how much of the gray black prints.
 */
export function CmykControls() {
  const { status, settings } = useEditorState();
  const { update, commit } = useEditorActions();
  const disabled = status === "empty";
  const apply = status === "dithered" ? commit : update;
  const screens =
    settings.algorithm !== "none" &&
    getAlgorithm(settings.algorithm)?.category === "screen";
  const setBlack = (set: typeof update, black: number) =>
    set(({ color }) => ({ color: { ...color, black } }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span id="cmyk-inks" className="text-label text-paper-dim">
          Inks
        </span>
        <ul aria-labelledby="cmyk-inks" className="grid grid-cols-4 gap-1.5">
          {INKS.map((ink) => (
            <li key={ink.id} className="flex flex-col gap-1">
              <span
                aria-hidden="true"
                className="border-line-strong block h-3.5 border"
                style={{ background: ink.color }}
              />
              <span className="text-readout text-paper-dim flex flex-col">
                {ink.name}
                {screens && (
                  <span>
                    <span className="sr-only">screen at </span>
                    {inkAngle(settings.screen.angle, ink.offset)}°
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-paper-dim text-xs leading-relaxed">
          Each ink is dithered on its own, then overprinted on white paper.
          {screens &&
            " The screen angle sets black; the other inks keep the classic 30° and 45° offsets, so the screens form rosettes instead of moiré."}
        </p>
      </div>
      <SliderField
        id="cmyk-black"
        label="Black ink"
        value={settings.color.black}
        defaultValue={DEFAULT_SETTINGS.color.black}
        min={0}
        max={1}
        step={0.01}
        disabled={disabled}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(black) => setBlack(update, black)}
        onCommit={(black) => setBlack(apply, black)}
      />
      <p className="text-paper-dim -mt-2 text-xs leading-relaxed">
        How much of the gray that cyan, magenta and yellow share prints in black
        instead. 0% prints no black.
      </p>
    </div>
  );
}
