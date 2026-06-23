# Verbatim enrichment — design spec

- **Status:** Draft for review. Pre-implementation.
- **Date:** 2026-06-23
- **Repo:** `zhiganov/democracy-without-politicians-mcp` (public)
- **Why:** the server is thinner than other book-power MCPs (6 tools vs ~12–13). Enrich its navigation *before* hosting it publicly — without breaking the author's condition.

## Goal

Make the MCP more navigable and detailed while keeping every tool output **verbatim**: the reader always sees Terry Bouricius's actual words, never a model-authored description.

## Hard constraint (load-bearing)

Terry's permission (2026-06-23): the tool must *"find relevant text within the book, and display my actual words, rather than AI-generated summaries."* Therefore:

- **Tool *content* is always a verbatim span of the book.** Any text returned as "what the book says" must be copy-exact from `book-data.ts`.
- **Model-authored text is allowed only as navigation chrome** — short topic/term/body *labels* and operational notes ("use get_chapter to read more") — clearly demarcated as metadata, never presented as his words.

## Why not the standard extraction pipeline

The book-power pipeline (`extract-core` + `extract-data.<flavor>`) builds dense catalogs whose entries are **model-authored descriptions** — paraphrase (the book-power#30 "cookie-cutter" audit). That is exactly what the condition forbids. This spec defines a verbatim-preserving alternative: **extract *structure*, serve *text*.**

## Design principle: index to his words, never replace them

Two layers:

1. **Structure layer (build-time).** Identify *where* things are — term definitions, named real-world cases, per-chapter anchor passages, cross-references. Store **locations** (chapter + passage id/offset) and a short navigation **label**. Never store a paraphrased description.
2. **Retrieval layer (runtime).** Every tool resolves a location (or a search) to a **verbatim span** of `book-data.ts` and returns that.

An LLM *may* be used at build-time to **locate and label** (input: chapter text; output: `{label, chapter, verbatim_span}`), but its output is discarded except for the label and the span boundaries. It never writes prose that ships.

## Tools (new + changed)

| Tool | Change | Returns |
|------|--------|---------|
| `search_content` | **Upgrade ranking** (see below) | verbatim paragraphs (unchanged shape) |
| `define_term` / `get_glossary` | **new** | his coined terms (electoral imperative, multi-body sortition, Policy Jury, neuro-politics, descriptive representation, …) → the **verbatim passage where he introduces/defines each** + chapter |
| `find_cases` | **new** | the real-world examples he cites (Ostbelgien, the Paris assembly, Athenian *nomothetai*, Burlington, …) → verbatim context + chapter |
| `get_chapter_highlights` | **new** | per-chapter **verbatim anchor passages** (the 2–4 spans that carry the chapter) |
| `get_principles`, `get_multi_body_design` | keep | already verbatim entry points |
| `get_book_info`, `list_chapters`, `get_chapter` | keep | unchanged |

## Compliance guardrail (the test that lets us host)

A build/test assertion: **every excerpt any tool can return is a verbatim substring of `book-data.ts`.** Concretely — for the curated layers (glossary, cases, highlights, topics, bodies), resolve each entry and assert `bookText.includes(excerpt)`; fail the build otherwise. This is the single check that proves the condition holds across the whole tool surface. Labels and operational notes are exempt (they are metadata, returned in separate fields).

## Retrieval upgrade (search quality is the biggest lever)

Current `search_content` scores by raw term frequency — crude. Options:

- **(A) BM25 / TF-IDF over the existing paragraphs.** Deterministic, no new dependency, no model, big improvement over raw frequency. Cheap to ship and host.
- **(B) Local semantic embeddings.** Precompute paragraph vectors at build-time with a small local model (e.g. `transformers.js` / MiniLM, ONNX); embed the query at runtime; cosine top-k. Handles synonyms/concepts ("fairness", "legitimacy") that keyword misses. Self-contained (no external API, no per-query cost) — important for a public hosted endpoint — but adds a model load (~25 MB) and a dependency.
- **(C) API embeddings** (OpenAI/Voyage/Cohere). Best quality, but adds a runtime API key + per-query cost to a free public service. **Rejected** for the hosted build.

**Recommendation:** ship **(A) BM25 first** (de-risks, deterministic, zero new deps), evaluate against real questions; add **(B) local embeddings** as a hybrid only if BM25 is insufficient. Both return verbatim passages, so both are compliant.

## Phasing

1. **Phase 1 — curated verbatim layers:** `define_term`, `find_cases`, `get_chapter_highlights` + the verbatim-substring guardrail test. (Same shape as today's topics/bodies; quick.)
2. **Phase 2 — retrieval:** BM25 ranking for `search_content` (+ optional local-embedding hybrid).
3. **Phase 3 — host:** add a StreamableHTTP transport alongside stdio; deploy to Railway under the Book Power project; re-run the guardrail + smoke before exposing it.

## Non-goals

- No paraphrased catalogs, model-authored descriptions, or "summary" tools.
- No restructuring of his argument into our taxonomy beyond short navigation labels.

## Decisions (resolved 2026-06-23)

1. **Retrieval:** **BM25 first** (Phase 2). Local embeddings only if BM25 proves insufficient.
2. **Sizing:** **~20 glossary terms**, ~10–15 cases.
3. **Labels:** **keep** our short navigation labels as index headings (clearly demarcated as metadata, not his words).
4. **Host:** **public** Railway endpoint, no auth — like the other public book-power MCPs (Phase 3).
