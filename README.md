# Democracy Without Politicians — MCP

A "search and read the book" MCP server for **Terry Bouricius, *Democracy Without Politicians: Government By the People*** (Routledge, 2026).

## How this respects the author

The book is **CC BY-NC-ND 4.0** (Open Access — free copy at [Taylor & Francis](https://www.taylorfrancis.com/books/9781041125549)). The author, **Terry Bouricius, gave express permission (2026-06-23)** to build a question-and-answer / indexing tool over it, on one condition:

> *"the search tool find relevant text within the book, and display my actual words, rather than AI-generated summaries."*

This server is built to honour exactly that. **Every tool returns verbatim passages from the book** — nothing is summarised or paraphrased:

- `search_content`, `get_chapter` return the book's text directly.
- `get_principles` and `get_multi_body_design` are **curated entry points**: a short topic/body label (navigation only) plus a **verbatim excerpt** the server retrieves from the book at request time. The labels orient you; the substance is always Bouricius's own words.
- Every response carries attribution to the author.

If you build on this, keep that contract: surface his text, attribute him, and never present paraphrase as his words.

## Tools

| Tool | Returns |
|------|---------|
| `get_book_info` | Title, author, license, free-copy link, table of contents |
| `list_chapters` | The 17 chapters (numbers + titles) |
| `get_chapter` | A chapter's **verbatim** text by number (1–17) or title (paginated) |
| `search_content` | Keyword search → the most relevant **verbatim** paragraphs + chapter |
| `get_principles` | 12 key topics, each with a **verbatim excerpt** and its chapter |
| `get_multi_body_design` | The seven bodies of the multi-body sortition design (Ch 16), each with a **verbatim excerpt** |
| `get_glossary` | ~20 terms he coins or relies on (index) |
| `define_term` | The **verbatim passage** where he introduces a given term |
| `find_cases` | Real-world examples he cites (Athens, Ostbelgien, BC, Paris, Oregon, Fishkin, …), each with a **verbatim excerpt** |
| `get_chapter_highlights` | A chapter's **verbatim** anchor passages |

Every tool returns Bouricius's own words; the topic/term/case *labels* are navigation only. A build test (`scripts/verify-enrichment.mjs`) asserts every excerpt any tool can return is a verbatim substring of the book.

## Build

```bash
git clone https://github.com/zhiganov/democracy-without-politicians-mcp
cd democracy-without-politicians-mcp
npm install
npm run gen     # (re)generate src/book-data.ts — optional; the text is already committed
npm run build   # tsc -> dist/
node scripts/smoke.mjs          # end-to-end tool test
node scripts/verify-rework.mjs  # dump the retrieved verbatim excerpts to eyeball
```

## Use it in Claude

It's hosted — no clone, no Node, no build. Point your client at the remote server.

**Claude Code (user scope — works from any directory):**
```bash
claude mcp add --transport http -s user democracy-without-politicians https://democracy-without-politicians-mcp-production.up.railway.app/mcp
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "democracy-without-politicians": {
      "url": "https://democracy-without-politicians-mcp-production.up.railway.app/mcp",
      "transport": "http"
    }
  }
}
```

Restart the client after adding.

### Run it locally instead (dev / offline)

Clone and build (see [Build](#build) above), then register the local stdio server:

```bash
claude mcp add democracy-without-politicians -s user -- node "<abs-path>/dist/index.js"
```

Or in `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "democracy-without-politicians": {
      "command": "node",
      "args": ["<abs-path>/dist/index.js"]
    }
  }
}
```

## What you can ask

- "What's Bouricius's case that election reform can't fix democracy?"
- "Show me what the book says about Review Panels vs Policy Juries."
- "What does the book say about objections to sortition?"
- "Pull the passage where he describes the Rules Council."

## Attribution & license

*Democracy Without Politicians: Government By the People* by Terrill "Terry" Bouricius (Routledge, 2026), CC BY-NC-ND 4.0 (Open Access). This tool is shared with the author's express permission (2026-06-23) and displays verbatim text only.

**Dual-licensed** (see [`LICENSE`](LICENSE) + [`NOTICE`](NOTICE)): the server code is MIT; the embedded book text in `src/book-data.ts` remains © Terry Bouricius under CC BY-NC-ND 4.0 — non-commercial, with attribution, no derivatives of the text. Generated with the `book-power` pipeline.
