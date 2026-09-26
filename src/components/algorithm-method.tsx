import type { AlgorithmId } from "@/lib/algorithms";
import { getMethod } from "@/lib/editor/dither";
import type { ErrorKernel, ThresholdMatrix } from "@/lib/editor/matrices";
import { screenThreshold } from "@/lib/editor/screen";
import { DEFAULT_SETTINGS, SCREEN_LIMITS } from "@/lib/editor/settings";

/** Largest matrix shown in full; bigger ones show their top-left corner. */
const MAX_MATRIX = 8;

/** Explains how an algorithm decides each pixel, drawn from the engine's own data. */
export function AlgorithmMethod({ algorithm }: { algorithm: AlgorithmId }) {
  const method = getMethod(algorithm);

  if (method.kind === "diffusion") {
    return (
      <KernelDiagram kernel={method.kernel} serpentine={method.serpentine} />
    );
  }
  if (method.kind === "ordered") {
    return <MatrixDiagram matrix={method.matrix()} />;
  }
  if (method.kind === "screen") {
    return <ScreenDiagram lines={method.lines} />;
  }
  return (
    <p className="text-paper-dim max-w-prose leading-relaxed">
      Every pixel is compared with its own random threshold between 0 and 255.
      PixelSynth seeds the generator, so the grain stays put while you adjust
      other settings.
    </p>
  );
}

function KernelDiagram({
  kernel,
  serpentine,
}: {
  kernel: ErrorKernel;
  serpentine: boolean;
}) {
  const xs = kernel.taps.map(([dx]) => dx);
  const minX = Math.min(0, ...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...kernel.taps.map(([, dy]) => dy));
  const weightAt = (dx: number, dy: number) =>
    kernel.taps.find(([x, y]) => x === dx && y === dy)?.[2];
  const diffused = kernel.taps.reduce((sum, [, , w]) => sum + w, 0);

  const rows = Array.from({ length: maxY + 1 }, (_, dy) =>
    Array.from({ length: maxX - minX + 1 }, (_, i) => minX + i).map((dx) => ({
      dx,
      dy,
      weight: weightAt(dx, dy),
      current: dx === 0 && dy === 0,
      done: dy === 0 && dx < 0,
    })),
  );

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <table className="border-line shrink-0 border-collapse border">
        <caption className="sr-only">
          Error diffusion weights, as a fraction of {kernel.divisor}, by
          position relative to the current pixel
        </caption>
        <tbody>
          {rows.map((row, dy) => (
            <tr key={dy}>
              {row.map((cell) =>
                cell.current ? (
                  <td
                    key={cell.dx}
                    className="border-line bg-safelight text-ink size-14 border text-center text-sm font-semibold"
                  >
                    <span aria-hidden="true">✱</span>
                    <span className="sr-only">Current pixel</span>
                  </td>
                ) : (
                  <td
                    key={cell.dx}
                    className="border-line text-readout size-14 border text-center"
                  >
                    {cell.weight ? (
                      <span className="text-paper">
                        {cell.weight}
                        <span className="text-paper-dim">
                          /{kernel.divisor}
                        </span>
                      </span>
                    ) : (
                      <span className="text-paper-dim/50" aria-hidden="true">
                        {cell.done ? "·" : ""}
                      </span>
                    )}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="text-paper-dim flex max-w-prose list-disc flex-col gap-2 pl-5 leading-relaxed">
        <li>
          The error of the current pixel is spread over {kernel.taps.length}{" "}
          neighbors that haven’t been processed yet.
        </li>
        <li>
          {diffused === kernel.divisor
            ? "All of the error is carried forward."
            : `Only ${diffused}/${kernel.divisor} of the error is carried forward — the rest is dropped, which keeps highlights and shadows crisp.`}
        </li>
        <li>
          {serpentine
            ? "Rows are scanned in alternating directions (serpentine), which avoids diagonal streaks."
            : "Every row is scanned left to right."}
        </li>
      </ul>
    </div>
  );
}

function MatrixDiagram({ matrix }: { matrix: ThresholdMatrix }) {
  const shown = Math.min(matrix.size, MAX_MATRIX);
  const levels = matrix.size * matrix.size;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <MatrixTable
        matrix={matrix}
        shown={shown}
        caption={`Threshold ranks${
          shown < matrix.size
            ? `, top-left ${shown}×${shown} of ${matrix.size}×${matrix.size}`
            : ""
        }`}
      />
      <ul className="text-paper-dim flex max-w-prose list-disc flex-col gap-2 pl-5 leading-relaxed">
        <li>
          A {matrix.size}×{matrix.size} matrix of {levels} ranks is tiled across
          the image; a pixel turns white when its brightness exceeds the
          threshold at its position.
        </li>
        <li>
          That gives {levels + 1} distinct gray levels, each reproduced by a
          fixed dot pattern.
        </li>
        {shown < matrix.size && (
          <li>
            Showing the top-left {shown}×{shown} corner of the full{" "}
            {matrix.size}×{matrix.size} matrix.
          </li>
        )}
      </ul>
    </div>
  );
}

/** One cell of the default screen at 0°, ranked by the engine itself. */
function ScreenDiagram({ lines }: { lines: boolean }) {
  const { size, shape } = DEFAULT_SETTINGS.screen;
  const threshold = screenThreshold(
    { size, angle: 0 },
    lines ? "line" : shape,
    false,
  );
  const values = Array.from({ length: size * size }, (_, p) =>
    threshold(p % size, Math.floor(p / size)),
  );
  // Rank = pixels that turn white before this one; ties share a rank.
  const ranks = Uint16Array.from(values, (v) =>
    values.reduce((count, other) => count + (other < v ? 1 : 0), 0),
  );

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <MatrixTable
        matrix={{ size, ranks }}
        shown={size}
        caption={`Threshold ranks of one ${size}×${size} ${
          lines ? "line" : "dot"
        } cell at 0°`}
      />
      <ul className="text-paper-dim flex max-w-prose list-disc flex-col gap-2 pl-5 leading-relaxed">
        {lines ? (
          <li>
            The image is crossed by parallel lines {size} pixels apart; each
            line thickens from its middle as the image gets darker, one row of
            pixels at a time.
          </li>
        ) : (
          <li>
            The image is covered by a grid of {size}×{size} pixel cells, each
            holding one dot that grows from its center as the image gets darker.
            The round dot becomes a checkerboard at 50% gray, then round holes.
          </li>
        )}
        <li>
          A pixel turns white when its brightness exceeds the threshold at its
          position; the thresholds rank pixels by their distance to the{" "}
          {lines ? "line" : "dot"} center. Ranking pixels as they actually fall
          on the grid keeps every gray level exact.
        </li>
        <li>
          In the editor, set the {lines ? "line spacing" : "screen size"} (
          {SCREEN_LIMITS.size.min}–{SCREEN_LIMITS.size.max} px) and the angle
          {lines ? "" : ", and pick round, square or diamond dots"}. With dots
          lighter than the background, the {lines ? "lines" : "dots"} mark the
          light areas instead.
        </li>
      </ul>
    </div>
  );
}

function MatrixTable({
  matrix,
  shown,
  caption,
}: {
  matrix: ThresholdMatrix;
  shown: number;
  caption: string;
}) {
  const levels = matrix.size * matrix.size;

  return (
    <table className="border-line shrink-0 border-collapse border">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {Array.from({ length: shown }, (_, y) => (
          <tr key={y}>
            {Array.from({ length: shown }, (_, x) => {
              const rank = matrix.ranks[y * matrix.size + x];
              const t = (rank + 0.5) / levels;
              return (
                <td
                  key={x}
                  className="text-readout size-10 text-center"
                  // Heat stays in the dark range so paper text keeps ≥ 5:1.
                  style={{
                    background: `rgb(236 228 214 / ${(0.04 + t * 0.32).toFixed(3)})`,
                  }}
                >
                  {rank}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
