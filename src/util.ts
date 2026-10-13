import type { Citation } from "./types";

export function citationLabel(c: Citation): string {
  if (c.page) return `Page ${c.page}`;
  if (c.slide) return `Slide ${c.slide}`;
  if (c.timestamp) return c.timestamp;
  return "Source";
}