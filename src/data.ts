// Navigation layer over the verbatim book text.
//
// Per the author's permission (Terry Bouricius, LinkedIn DM 2026-06-23), this tool
// must surface relevant text and display HIS ACTUAL WORDS — not AI-generated
// summaries. So nothing here describes or paraphrases the book. Each entry below is
// only a curated *entry point*: a short topic/body label + a search query + the
// chapter(s) to look in. The server (index.ts) uses these to retrieve a VERBATIM
// passage from the book at request time. Labels are navigation, like index headings;
// the substance returned to the user is always Bouricius's own text.
import { CHAPTERS } from "./book-data.js";

export { CHAPTERS };

export const ATTRIBUTION =
  'Terrill "Terry" Bouricius, "Democracy Without Politicians: Government By the People" ' +
  "(Routledge, 2026), CC BY-NC-ND 4.0. Verbatim excerpt, shared with the author's permission (2026-06-23).";

export const BOOK_INFO = {
  title: "Democracy Without Politicians: Government By the People",
  author: 'Terrill "Terry" Bouricius',
  publisher: "Routledge",
  year: 2026,
  isbn: "9781041125549",
  license: "CC BY-NC-ND 4.0 (Open Access)",
  freeCopy: "https://www.taylorfrancis.com/books/9781041125549",
  usageNote:
    "Shared with the author's express permission (2026-06-23), on the condition that it surfaces relevant text and displays his actual words, not AI-generated summaries. Every tool returns verbatim passages from the book. Always attribute the author; never present paraphrase as his words.",
  toc: CHAPTERS.map((c) => ({ number: c.number, title: c.title })),
};

// Curated entry points. NOT descriptions — a topic label + the query and chapter(s)
// the server uses to pull a verbatim excerpt.
export interface TopicEntry {
  topic: string;
  chapters: number[];
  query: string;
}

export const KEY_TOPICS: TopicEntry[] = [
  { topic: "Elections select a political class, not equals", chapters: [2, 6], query: "elections inherently aristocratic select the best political class elite" },
  { topic: "The electoral imperative distorts governance", chapters: [3], query: "electoral imperative re-election hot-button donors short-term incentive" },
  { topic: "Why election reform cannot fix the core flaw", chapters: [4], query: "ranked choice proportional representation campaign finance reform cannot solve" },
  { topic: "Sortition and descriptive representativeness", chapters: [6, 11], query: "stratified random sample descriptive representation mirror the population" },
  { topic: "It is the power to adopt laws that corrupts", chapters: [13, 16], query: "power to adopt laws corrupts majority faction entrench rig the rules" },
  { topic: "Separating functions so no single body is captured", chapters: [13, 16], query: "separate the functions agenda proposal drafting final decision capture" },
  { topic: "The drafters must not be the deciders", chapters: [16], query: "the body that drafts the bill should not be the body that passes it groupthink" },
  { topic: "Decide by listening and voting, not debating", chapters: [16], query: "secret ballot without floor debate wisdom of crowds democratic listening" },
  { topic: "Setting the rules behind a veil of ignorance", chapters: [16], query: "Rules Council veil of ignorance set the rules meta-legislative" },
  { topic: "How elections exploit our cognitive wiring", chapters: [7], query: "neuro-politics tribalism motivated reasoning status cognitive" },
  { topic: "Sortition is representation, not direct democracy", chapters: [11], query: "representation not direct democracy randomly selected deliberate on behalf" },
  { topic: "Transition through truncated sortition designs", chapters: [16, 17], query: "truncated sortition Ostbelgien Paris permanent assembly transition advisory" },
];

// The seven bodies of the multi-body reference design (Bouricius's own terms, Ch 16).
// The server attaches a verbatim excerpt to each at request time.
export interface BodyEntry {
  name: string;
  kind: "core" | "meta-legislative";
  chapter: number;
  query: string;
}

export const MULTI_BODY = {
  note:
    "The multi-body sortition reference design is in Chapter 16 ('Sortition Design for the Future'). " +
    "The bodies below use Bouricius's own names; each is shown with a verbatim excerpt from the book. " +
    "Use get_chapter with number 16 to read the full design in his own words.",
  chapter: 16,
  bodies: [
    { name: "Agenda Council", kind: "core", chapter: 16, query: "Agenda Council sets the agenda topics issues a call for proposals" },
    { name: "Interest Panels", kind: "core", chapter: 16, query: "Interest Panels self-selected draft proposals raise ideas never decide" },
    { name: "Review Panels", kind: "core", chapter: 16, query: "Review Panels committee work hearings expert witnesses amend draft the bill" },
    { name: "Policy Juries", kind: "core", chapter: 16, query: "Policy Jury final decision secret ballot nomothetai balanced presentations" },
    { name: "Coordination Council", kind: "core", chapter: 16, query: "Coordination Council harmonise policies budgets across review panels" },
    { name: "Rules Council", kind: "meta-legislative", chapter: 16, query: "Rules Council rules of the system lottery method veil of ignorance" },
    { name: "Oversight Councils", kind: "meta-legislative", chapter: 16, query: "Oversight Council complaints biased presentations hire and fire staff" },
  ] as BodyEntry[],
};
