import Link from "next/link";
import type { FaqEntry, FaqPart } from "@/lib/faq";

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-safelight";

export const textLink = `text-paper hover:text-paper-hot hover:decoration-paper-hot decoration-line-strong underline underline-offset-4 transition-colors ${focusRing}`;

/** Collapsible questions; build the FAQPage data from the same entries. */
export function FaqList({ faq }: { faq: FaqEntry[] }) {
  return (
    <div className="border-line max-w-3xl border-b">
      {faq.map((entry) => (
        <details key={entry.question} className="group border-line border-t">
          <summary
            className={`flex cursor-pointer list-none items-baseline gap-3 py-4 font-medium ${focusRing}`}
          >
            <span
              aria-hidden="true"
              className="text-paper-dim transition-transform group-open:rotate-90 motion-reduce:transition-none"
            >
              &gt;
            </span>
            {entry.question}
          </summary>
          <p className="text-paper-dim border-line-strong mb-5 ml-1.5 border-l pl-5 leading-relaxed">
            <RichText parts={entry.answer} />
          </p>
        </details>
      ))}
    </div>
  );
}

/** Text with inline links; absolute URLs open in a new tab. */
export function RichText({ parts }: { parts: FaqPart[] }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : /^https?:/.test(part.href) ? (
      <a
        key={index}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
        className={textLink}
      >
        {part.text}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ) : (
      <Link key={index} href={part.href} className={textLink}>
        {part.text}
      </Link>
    ),
  );
}
