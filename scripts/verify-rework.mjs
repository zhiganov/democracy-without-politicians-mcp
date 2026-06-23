// Verify the verbatim rework: spawn the built server, dump the reworked tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const transport = new StdioClientTransport({ command: "node", args: [join(root, "dist", "index.js")] });
const client = new Client({ name: "verify", version: "0" });
await client.connect(transport);

const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return JSON.parse(r.content.map((c) => c.text).join(""));
};

const bi = await call("get_book_info");
console.log("get_book_info has summary field?:", "summary" in bi, "| keys:", Object.keys(bi).join(","));

console.log("\n===== get_principles (topic -> retrieved verbatim excerpt) =====");
const princ = await call("get_principles");
for (const t of princ.topics) {
  const ex = (t.excerpt ?? "(none)").replace(/\s+/g, " ");
  console.log(`\n• ${t.topic}  [ch ${t.chapters.join(",")}] -> drew from ch ${t.chapter ?? "?"}`);
  console.log(`  ${ex.slice(0, 240)}…`);
}

console.log("\n===== get_multi_body_design (body -> retrieved verbatim excerpt) =====");
const mb = await call("get_multi_body_design");
for (const b of mb.bodies) {
  const ex = (b.excerpt ?? "(none)").replace(/\s+/g, " ");
  console.log(`\n• ${b.name} (${b.kind}) -> ch ${b.chapter ?? "?"}`);
  console.log(`  ${ex.slice(0, 200)}…`);
}

console.log("\n===== search_content('election reform') =====");
const sc = await call("search_content", { query: "election reform cannot fix", limit: 2 });
console.log("attribution present:", Boolean(sc.attribution));
console.log((sc.results[0]?.excerpt ?? "").replace(/\s+/g, " ").slice(0, 240) + "…");

await client.close();
console.log("\nVERIFY DONE");
