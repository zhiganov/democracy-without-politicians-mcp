// Phase 1 verifier + verbatim guardrail.
// 1) prints glossary/case/highlight excerpts for eyeballing relevance;
// 2) asserts EVERY excerpt any tool returns is a verbatim substring of the book.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CHAPTERS, GLOSSARY, CASES } from "../dist/data.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BOOK = CHAPTERS.map((c) => c.text).join("\n");
const strip = (s) => (s ?? "").replace(/…$/, "");
const isVerbatim = (ex) => ex == null || BOOK.includes(strip(ex));

const transport = new StdioClientTransport({ command: "node", args: [join(root, "dist", "index.js")] });
const client = new Client({ name: "verify", version: "0" });
await client.connect(transport);
const get = async (name, args = {}) =>
  JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);

let checked = 0;
let failed = 0;
const check = (label, ex, fromCh) => {
  checked++;
  if (!isVerbatim(ex)) {
    failed++;
    console.log(`  ✗ NON-VERBATIM: ${label}`);
  }
  return (ex ?? "(none)").replace(/\s+/g, " ").slice(0, 130);
};

console.log("===== GLOSSARY (define_term per term) =====");
for (const g of GLOSSARY) {
  const r = await get("define_term", { term: g.term });
  console.log(`• ${g.term} [ch ${g.chapters.join(",")}] -> ch ${r.chapter ?? "?"}: ${check(g.term, r.excerpt)}…`);
}

console.log("\n===== CASES =====");
const fc = await get("find_cases");
for (const c of fc.cases) {
  console.log(`• ${c.name} [ch ${c.chapters.join(",")}] -> ch ${c.chapter ?? "?"}: ${check(c.name, c.excerpt)}…`);
}

console.log("\n===== guardrail across all other tools =====");
const princ = await get("get_principles");
princ.topics.forEach((t) => check(`topic:${t.topic}`, t.excerpt));
const mb = await get("get_multi_body_design");
mb.bodies.forEach((b) => check(`body:${b.name}`, b.excerpt));
for (let n = 1; n <= 17; n++) {
  const h = await get("get_chapter_highlights", { number: n });
  (h.highlights ?? []).forEach((ex, i) => check(`ch${n}.highlight${i}`, ex));
}
const sc = await get("search_content", { query: "accountability legitimacy sortition", limit: 5 });
sc.results.forEach((r, i) => check(`search${i}`, r.excerpt));

await client.close();
console.log(`\nGUARDRAIL: ${checked - failed}/${checked} verbatim. ${failed === 0 ? "PASS ✓" : "FAIL ✗"}`);
process.exit(failed === 0 ? 0 : 1);
