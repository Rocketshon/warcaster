import type { ReactNode } from 'react';

/**
 * Title-case a string: "INFANTRY" -> "Infantry", "CHAOS SPACE MARINES" -> "Chaos Space Marines"
 * Handles ALL CAPS Wahapedia keywords, already-capitalized text, and lowercase text.
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(/[\s]+/)
    .map((word) => {
      // Keep small connecting words lowercase (except first word)
      const smallWords = ['of', 'the', 'and', 'in', 'on', 'for', 'a', 'an', 'to'];
      if (smallWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    // Ensure first character is always uppercase
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Parse Wahapedia rules text into structured ReactNode elements.
 * Handles:
 *  - Paragraph breaks (double newlines)
 *  - Bullet points (lines starting with ■, •, -, *)
 *  - Bold/header patterns (ALL CAPS lines, or lines ending with ":")
 *  - Inline bold markers (text between ** or __)
 */
export function parseRuleText(text: string): ReactNode[] {
  if (!text) return [];

  const elements: ReactNode[] = [];
  // Split into paragraphs by double newline or single newline
  const paragraphs = text.split(/\n\n|\n/).filter((p) => p.trim());

  paragraphs.forEach((para, idx) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // Check if this is a bullet point
    const bulletMatch = trimmed.match(/^[■•\-\*]\s*(.*)/);
    if (bulletMatch) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1">
          <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
          <span className="text-stone-300 text-xs leading-relaxed">{bulletMatch[1]}</span>
        </div>
      );
      return;
    }

    // Check if this looks like a sub-heading (short, possibly ALL CAPS or ends with ":")
    const isHeading =
      (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
      (trimmed.endsWith(':') && trimmed.length < 80);

    if (isHeading) {
      elements.push(
        <h4
          key={idx}
          className="text-xs font-bold text-emerald-400 uppercase tracking-wide mt-3 mb-1"
        >
          {toTitleCase(trimmed.replace(/:$/, ''))}
        </h4>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={idx} className="text-xs text-stone-300 leading-relaxed mb-2">
        {trimmed}
      </p>
    );
  });

  return elements;
}

/**
 * Render a rules text block as formatted content.
 * Drop-in replacement for `<p className="whitespace-pre-line">{text}</p>`
 */
export function FormattedRuleText({ text, className }: { text: string; className?: string }) {
  const elements = parseRuleText(text);
  if (elements.length === 0) return null;
  return <div className={className}>{elements}</div>;
}

/**
 * Color map for battle size badges
 */
export function getBattleSizeColor(size: string): string {
  switch (size) {
    case 'Combat Patrol':
      return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    case 'Incursion':
      return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    case 'Strike Force':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    case 'Onslaught':
      return 'bg-red-500/20 border-red-500/30 text-red-400';
    default:
      return 'bg-stone-700 text-stone-300';
  }
}

/**
 * Color map for stratagem type badges
 */
export function getStratagemTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('battle tactic')) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
  if (t.includes('strategic ploy')) return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
  if (t.includes('epic deed')) return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
  if (t.includes('wargear')) return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
  return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
}

/**
 * Display-friendly result label with consistent formatting
 */
export function getResultLabel(result: 'victory' | 'defeat' | 'draw'): string {
  const map: Record<string, string> = {
    victory: 'Victory',
    defeat: 'Defeat',
    draw: 'Draw',
  };
  return map[result] || result;
}

/**
 * Format a W-L-D record string
 */
export function formatRecord(wins: number, losses: number, draws: number): string {
  return `${wins}W - ${losses}L - ${draws}D`;
}
