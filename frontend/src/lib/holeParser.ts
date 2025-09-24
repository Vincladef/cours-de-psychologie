export const HOLE_RE = /\[\[HOLE:([0-9a-fA-F-]{6,})\|([\s\S]*?)\]\]/g;

export interface HoleMatch {
  id: string;
  text: string;
}

export type ContentSegment =
  | { type: "html"; html: string }
  | { type: "hole"; id: string; text: string };

export function extractHoles(content: string): HoleMatch[] {
  const matches: HoleMatch[] = [];
  const seen = new Set<string>();
  const regex = new RegExp(HOLE_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const text = match[2];
    if (!seen.has(id)) {
      matches.push({ id, text });
      seen.add(id);
    }
  }
  return matches;
}

export function segmentContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = new RegExp(HOLE_RE.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "html", html: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "hole", id: match[1], text: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "html", html: content.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: "html", html: content });
  }

  return segments;
}
