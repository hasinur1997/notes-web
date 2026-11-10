/**
 * A small, safe Markdown renderer for note text. It builds React elements directly (no HTML
 * strings, no dangerouslySetInnerHTML), so text can never inject markup or scripts.
 *
 * Supported:
 *   # Heading / ## Subheading
 *   - item or * item   (bulleted list)
 *   1. item            (numbered list)
 *   **bold**  *italic* or _italic_  ++underline++  ~~strikethrough~~
 */
import { Fragment } from "react";
import { highlightText } from "@/lib/search";

const INLINE_RULES = [
  { pattern: /\*\*(.+?)\*\*/, render: (children, key) => <strong key={key}>{children}</strong> },
  { pattern: /\+\+(.+?)\+\+/, render: (children, key) => <u key={key}>{children}</u> },
  { pattern: /~~(.+?)~~/, render: (children, key) => <s key={key}>{children}</s> },
  { pattern: /(?:\*(?!\s)(.+?)(?<!\s)\*|_(?!\s)(.+?)(?<!\s)_)/, render: (children, key) => <em key={key}>{children}</em> },
];
/** Stops pathological nesting from recursing too deep. */
const MAX_INLINE_DEPTH = 4;

/**
 * Renders inline formatting inside one line of text.
 *
 * @param {string} text - Plain text with inline markers.
 * @param {number} [depth=0] - Current nesting depth.
 * @param {RegExp | null} [highlight=null] - Words to mark in the text (see lib/search).
 * @returns {React.ReactNode[]} Text and formatting elements.
 */
export function renderInline(text, depth = 0, highlight = null) {
  // Plain text is the only place highlighting happens, so marks never break formatting.
  const plain = (value, key) => highlightText(value, highlight, `${depth}-${key}-`);
  if (!text || depth >= MAX_INLINE_DEPTH) return [plain(text, "end")];

  // Find the earliest match among all rules.
  let best = null;
  for (const rule of INLINE_RULES) {
    const match = rule.pattern.exec(text);
    if (match && (!best || match.index < best.match.index)) best = { rule, match };
  }
  if (!best) return [plain(text, "all")];

  const { rule, match } = best;
  const inner = match[1] ?? match[2];
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  return [
    ...(before ? [<Fragment key={`${depth}-b${match.index}`}>{plain(before, `b${match.index}`)}</Fragment>] : []),
    rule.render(renderInline(inner, depth + 1, highlight), `${depth}-${match.index}`),
    ...renderInline(after, depth, highlight),
  ];
}

const HEADING = /^(#{1,2})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

/**
 * Groups lines into blocks: headings, bulleted lists, numbered lists and paragraphs.
 *
 * @param {string} text - Markdown text.
 * @returns {{ type: "h1" | "h2" | "ul" | "ol" | "p", lines: string[] }[]} Blocks in order.
 */
export function parseBlocks(text) {
  const blocks = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    const last = blocks[blocks.length - 1];

    if (!line.trim()) {
      blocks.push({ type: "gap", lines: [] });
    } else if (heading) {
      blocks.push({ type: heading[1].length === 1 ? "h1" : "h2", lines: [heading[2]] });
    } else if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)[1];
      if (last?.type === type) last.lines.push(item);
      else blocks.push({ type, lines: [item] });
    } else if (last?.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }
  // Collapse runs of blank lines and drop leading/trailing ones.
  return blocks.filter((block, i, all) => block.type !== "gap" || (i > 0 && i < all.length - 1 && all[i - 1].type !== "gap"));
}

/**
 * Renders note Markdown as React elements.
 *
 * @param {object} props
 * @param {string} props.text - Markdown text.
 * @param {string} [props.className] - Classes for the wrapper.
 * @param {RegExp | null} [props.highlight] - Search words to mark (from highlightPattern).
 * @returns {JSX.Element}
 */
export function Markdown({ text, className = "", highlight = null }) {
  const inline = (line) => renderInline(line, 0, highlight);
  return (
    <div className={className}>
      {parseBlocks(text).map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "h1":
            return (
              <p key={key} className="text-[17px] leading-6 font-extrabold">
                {inline(block.lines[0])}
              </p>
            );
          case "h2":
            return (
              <p key={key} className="text-[15px] leading-[22px] font-bold">
                {inline(block.lines[0])}
              </p>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={key} className={`pl-5 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
                {block.lines.map((item, i) => (
                  <li key={i}>{inline(item)}</li>
                ))}
              </List>
            );
          }
          case "gap":
            return <div key={key} className="h-2" aria-hidden="true" />;
          default:
            return (
              <p key={key}>
                {block.lines.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {inline(line)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
