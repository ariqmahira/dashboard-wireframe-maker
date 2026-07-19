import type { Card } from './types';

/** Columns a card consumes within its row: its span plus any left offset. */
export function cardUsedSpan(card: Card): number {
  return card.span + (card.offset ?? 0);
}

/** Total columns consumed by a row (sum of each card's span + offset). */
export function rowUsedSpan(row: Card[]): number {
  return row.reduce((sum, c) => sum + cardUsedSpan(c), 0);
}

/**
 * Group a section's flat card list into implicit rows.
 *
 * A new row begins when the card is flagged `rowStart`, or when adding it would
 * exceed the current row's width cap. The cap for a row is taken from its first
 * card's `rowSpan` (default 24, clamped to 24), which lets a row deliberately
 * total fewer than 24 columns with the leftover staying empty on the right.
 */
export function computeRowGroups(cards: Card[]): Card[][] {
  const rows: Card[][] = [];
  let current: Card[] = [];
  let used = 0;
  let cap = 24;

  for (const card of cards) {
    const isFirst = current.length === 0;
    const wouldOverflow = used + cardUsedSpan(card) > cap;

    if (!isFirst && (card.rowStart || wouldOverflow)) {
      rows.push(current);
      current = [];
      used = 0;
    }

    if (current.length === 0) {
      cap = Math.min(24, card.rowSpan ?? 24);
    }

    current.push(card);
    used += cardUsedSpan(card);
  }

  if (current.length) rows.push(current);
  return rows;
}
