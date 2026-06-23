// End-to-end smoke test: spawn the built server over stdio and call its tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "smoke", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const get = async (name, args = {}) =>
  JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const info = await get("get_book_info");
console.log("BOOK:", info.title, "| license:", info.license, "| chapters:", info.toc.length, "| no summary:", !("summary" in info));

const sr = await get("search_content", { query: "policy jury secret ballot without debate", limit: 2 });
console.log("SEARCH hits:", sr.results.length, "| attribution:", Boolean(sr.attribution), "| top:", sr.results[0]?.chapter, "-", sr.results[0]?.chapterTitle);
console.log("  excerpt:", (sr.results[0]?.excerpt || "").replace(/\s+/g, " ").slice(0, 160));

const mbd = await get("get_multi_body_design");
console.log("BODIES:", mbd.bodies.length, "| all have verbatim excerpt:", mbd.bodies.every((b) => typeof b.excerpt === "string" && b.excerpt.length > 40));

const pr = await get("get_principles");
console.log("TOPICS:", pr.topics.length, "| all have verbatim excerpt:", pr.topics.every((t) => typeof t.excerpt === "string" && t.excerpt.length > 40), "| e.g.:", pr.topics[0].topic);

const ch = await get("get_chapter", { number: 11 });
console.log("CH11:", ch.title, "| chars:", ch.totalChars, "| hasMore:", ch.hasMore, "| attribution:", Boolean(ch.attribution));

await client.close();
console.log("OK — smoke passed");
process.exit(0);
