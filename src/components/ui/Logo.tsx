import Image from "next/image";

/** The agency's logo — black wordmark + green accent; the app is light-only by design. */
export function Logo({ height = 26 }: { height?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Next Marketing Experiencial"
      width={104}
      height={26}
      style={{ height, width: "auto" }}
      priority
    />
  );
}

/**
 * NEXIT's own logotype, set in Nunito Black — the closest free match to
 * Circular, the rounded geometric sans the "next!" wordmark uses — so the
 * software's mark reads as kin to the company logo rather than a mismatched
 * label next to it. The small square dot echoes the accent dot on the "!"
 * in the company mark, in the exact green sampled from that logo file.
 */
export function NexitWordmark({ height = 19 }: { height?: number }) {
  return (
    <span
      className="inline-flex items-center gap-[3px] font-black lowercase tracking-tight text-text"
      style={{ fontSize: height, lineHeight: 1 }}
    >
      nexit
      <span
        aria-hidden
        className="inline-block flex-shrink-0 rounded-[2px] bg-green"
        style={{ width: Math.round(height * 0.22), height: Math.round(height * 0.22) }}
      />
    </span>
  );
}
