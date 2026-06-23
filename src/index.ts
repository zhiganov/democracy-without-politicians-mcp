#!/usr/bin/env node
// MCP for Terry Bouricius, "Democracy Without Politicians" (Routledge 2026, CC BY-NC-ND 4.0).
//
// Shared with the author's express permission (2026-06-23), on the condition that the
// tool surfaces relevant text and displays HIS ACTUAL WORDS — not AI-generated summaries.
// Every tool returns verbatim passages from the book; the "topics" and "bodies" tools are
// curated entry points that retrieve a verbatim excerpt at request time, never paraphrase.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BOOK_INFO, KEY_TOPICS, MULTI_BODY, ATTRIBUTION, CHAPTERS } from "./data.js";

// ---- build a paragraph search index at startup ----
interface Para {
  ch: number;
  title: string;
  text: string;
}
const PARAS: Para[] = [];
for (const c of CHAPTERS) {
  for (const raw of c.text.split(/\n\n+/)) {
    const t = raw.trim();
    if (t.length >= 80) PARAS.push({ ch: c.number, title: c.title, text: t });
  }
}

const STOP = new Set([
  "the", "and", "not", "for", "with", "that", "this", "are", "was", "were", "but", "has",
  "have", "from", "what", "when", "which", "will", "would", "their", "there", "them", "they",
  "then", "than", "into", "also", "such", "can", "may", "must", "more", "most", "some", "any",
  "all", "one", "our", "out", "who", "how", "its", "his", "her", "him", "she", "you", "your",
]);

function scoreParas(query: string, pool: Para[]) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
  if (terms.length === 0) return [];
  return pool
    .map((p) => {
      const lc = p.text.toLowerCase();
      let freq = 0;
      let distinct = 0;
      for (const term of terms) {
        let idx = lc.indexOf(term);
        if (idx === -1) continue;
        distinct++;
        while (idx !== -1) {
          freq++;
          idx = lc.indexOf(term, idx + term.length);
        }
      }
      return { p, score: freq + distinct * 3 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

function clip(text: string, max: number) {
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function searchContent(query: string, limit = 8) {
  const scored = scoreParas(query, PARAS).slice(0, Math.max(1, Math.min(limit, 25)));
  return scored.map((s) => ({
    chapter: s.p.ch,
    chapterTitle: s.p.title,
    excerpt: clip(s.p.text, 700),
  }));
}

// Retrieve the single best VERBATIM paragraph for a curated entry point. Scoped to the
// hinted chapters first; falls back to the whole book if the hint yields nothing.
function retrieveExcerpt(query: string, chapters: number[]) {
  const scoped = chapters.length
    ? scoreParas(query, PARAS.filter((p) => chapters.includes(p.ch)))
    : [];
  const best = (scoped.length ? scoped : scoreParas(query, PARAS))[0];
  if (!best) return null;
  return { chapter: best.p.ch, chapterTitle: best.p.title, excerpt: clip(best.p.text, 900) };
}

function getChapter(opts: { number?: number; title?: string; offset?: number }) {
  let ch = undefined as (typeof CHAPTERS)[number] | undefined;
  if (typeof opts.number === "number") {
    ch = CHAPTERS.find((c) => c.number === opts.number);
  } else if (opts.title) {
    const q = opts.title.toLowerCase();
    ch = CHAPTERS.find((c) => c.title.toLowerCase().includes(q));
  }
  if (!ch) return { error: "Chapter not found. Use list_chapters for numbers and titles." };
  const offset = Math.max(0, opts.offset ?? 0);
  const MAX = 16000;
  const text = ch.text.slice(offset, offset + MAX);
  const hasMore = offset + MAX < ch.text.length;
  return {
    number: ch.number,
    title: ch.title,
    totalChars: ch.text.length,
    offset,
    text,
    hasMore,
    nextOffset: hasMore ? offset + MAX : null,
    attribution: ATTRIBUTION,
  };
}

const TOOLS = [
  {
    name: "get_book_info",
    description:
      "Title, author, license, free-copy link, usage note, and table of contents of Democracy Without Politicians by Terry Bouricius.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "list_chapters",
    description: "List all 17 chapters with their numbers and titles.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_chapter",
    description:
      "Return a chapter's verbatim text by number (1-17) or title substring. Long chapters paginate via offset/nextOffset.",
    inputSchema: {
      type: "object" as const,
      properties: {
        number: { type: "integer", description: "Chapter number 1-17" },
        title: { type: "string", description: "A substring of the chapter title" },
        offset: { type: "integer", description: "Character offset to start from (default 0)" },
      },
    },
  },
  {
    name: "search_content",
    description:
      "Keyword search across the full book text; returns the most relevant verbatim paragraphs with their chapter. Use for 'what does Bouricius say about X' questions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search terms" },
        limit: { type: "integer", description: "Max results (default 8, max 25)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_principles",
    description:
      "Key topics/arguments in the book as curated entry points. Each returns a VERBATIM excerpt in the author's own words plus its chapter — not a summary. Use get_chapter or search_content to read further.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_multi_body_design",
    description:
      "Bouricius's signature 'multi-body sortition' reference design (Chapter 16): the seven specialised randomly-selected bodies (Agenda Council, Interest Panels, Review Panels, Policy Juries, Coordination Council, Rules Council, Oversight Councils), each with a VERBATIM excerpt from the book.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

const server = new Server(
  { name: "democracy-without-politicians", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const a = (req.params.arguments ?? {}) as Record<string, unknown>;
  const json = (v: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }],
  });
  switch (name) {
    case "get_book_info":
      return json(BOOK_INFO);
    case "list_chapters":
      return json(BOOK_INFO.toc);
    case "get_chapter":
      return json(
        getChapter({
          number: typeof a.number === "number" ? a.number : undefined,
          title: typeof a.title === "string" ? a.title : undefined,
          offset: typeof a.offset === "number" ? a.offset : undefined,
        }),
      );
    case "search_content":
      return json({
        attribution: ATTRIBUTION,
        results: searchContent(
          String(a.query ?? ""),
          typeof a.limit === "number" ? a.limit : undefined,
        ),
      });
    case "get_principles":
      return json({
        note:
          "Curated entry points into the book. The 'topic' is a navigation label; the 'excerpt' is Bouricius's verbatim text. Use get_chapter or search_content to read more.",
        attribution: ATTRIBUTION,
        topics: KEY_TOPICS.map((t) => ({
          topic: t.topic,
          chapters: t.chapters,
          ...(retrieveExcerpt(t.query, t.chapters) ?? {
            excerpt: null,
            note: "No single passage matched; use search_content.",
          }),
        })),
      });
    case "get_multi_body_design":
      return json({
        note: MULTI_BODY.note,
        chapter: MULTI_BODY.chapter,
        attribution: ATTRIBUTION,
        bodies: MULTI_BODY.bodies.map((b) => ({
          name: b.name,
          kind: b.kind,
          ...(retrieveExcerpt(b.query, [b.chapter]) ?? {
            excerpt: null,
            note: "No single passage matched; use get_chapter(16).",
          }),
        })),
      });
    default:
      return { content: [{ type: "text" as const, text: `Unknown tool: ${name}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("democracy-without-politicians MCP server running on stdio");
