# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A "search and read the book" **MCP server** over Terry Bouricius's *Democracy Without Politicians: Government By the People* (Routledge, 2026). Built with the `book-power` pipeline. Public: `zhiganov/democracy-without-politicians-mcp`.

**The defining constraint:** the book is CC BY-NC-ND, and the author granted permission (2026-06-23) on one condition — the tool must *"find relevant text within the book, and display my actual words, rather than AI-generated summaries."* So **every tool returns a verbatim passage from the book.** Nothing summarises or paraphrases. Any change that makes a tool emit model-authored prose breaks the permission. See `README.md`, `NOTICE`, and the comment headers in `src/`.

## Commands

```
npm install
npm run gen                       # regenerate src/book-data.ts from source (optional — text is committed)
npm run build                     # tsc -> dist/
npm start                         # node dist/index.js (stdio MCP server)
node scripts/smoke.mjs            # end-to-end exercise of every tool
node scripts/verify-rework.mjs    # dump each tool's retrieved excerpts to eyeball
node scripts/verify-enrichment.mjs  # GUARDRAIL — see below
```

There is no test runner; the three `scripts/*.mjs` are the verification harness. Run `verify-enrichment.mjs` after any change to retrieval or the curated data — it is the gate that keeps the permission contract true.

## Architecture

A stdio MCP server built on the **low-level `Server` SDK** (not `McpServer`), exposing 10 tools (`get_book_info`, `list_chapters`, `get_chapter`, `search_content`, `get_principles`, `get_multi_body_design`, `get_glossary`, `define_term`, `find_cases`, `get_chapter_highlights`). Three data layers:

1. **`src/book-data.ts` — the verbatim book.** Auto-generated (`npm run gen`), ~17 chapters as `RawChapter[]`, large. **Do not hand-edit**; change the source or the `gen` script.
2. **`src/data.ts` — navigation, not content.** `ATTRIBUTION`, `BOOK_INFO`, and the curated entry points (`KEY_TOPICS` ×12, `MULTI_BODY` ×7, `GLOSSARY` ×~20, `CASES` ×10). Each entry is a label + a search `query` + chapter hint — **never a description of the book**. The labels are index headings; the substance is always retrieved from `book-data.ts` at request time.
3. **`src/index.ts` — retrieval.** At startup it splits chapters into paragraphs (≥80 chars, skipping bibliography entries via `looksLikeCitation`), keyword-scores them (`scoreParas` with a stopword set), and `retrieveExcerpt(query, chapters)` ranks paragraphs with a chapter **score boost** (`+6`, not a hard filter). The curated entries feed their `query`/`chapters` into this to attach a verbatim excerpt. Every response carries `ATTRIBUTION`.

**The invariant:** `scripts/verify-enrichment.mjs` asserts that every excerpt any tool can return is a verbatim substring of the book (modulo a trailing `…`). If it fails, a code path is paraphrasing — fix the retrieval, never the assertion.

## Gotchas

- **Never add a summarising/paraphrasing code path.** The author's permission is conditional on verbatim-only output; `verify-enrichment.mjs` enforces it. New tools must retrieve, not generate.
- **`book-data.ts` is generated** — edit via `gen`, not directly.
- **Dual-licensed: keep them separate.** Code is MIT (`LICENSE`, canonical text); the embedded book text stays © Bouricius under CC BY-NC-ND (`NOTICE`). Do not append the book-text terms into `LICENSE` — that drops GitHub's licence detection to `NOASSERTION`.
- Load in Claude at **user scope** (`claude mcp add … -s user`) so it works from any directory.
