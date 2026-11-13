# Architecture Decisions

## ADR-001 — TypeScript

The project uses TypeScript with strict type checking.

Reason:
TypeScript provides compile-time contracts for both developers and AI agents.

---

## ADR-002 — Pinia owns Todo state

The Todo collection is owned by Pinia.

Components must not maintain duplicate Todo collections.

---

## ADR-003 — Persistence service

Browser persistence is isolated in `src/services/todoStorage.ts`.

Vue components must not directly access localStorage.

---

## ADR-004 — No UI framework

The project initially uses plain HTML and CSS.

Reason:
The purpose of the project is to evaluate Vue, TypeScript and AI-assisted development,
not a component library.

---

## ADR-005 — General note tab is built in

A note with no tab (`tab_id` is NULL) belongs to the General tab, which has no database row.

Reason:
Existing notes need no data migration, deleting a tab can move its notes with
`on delete set null`, and there is always at least one tab. This mirrors how tasks without
a category appear in Uncategorized.

Consequence:
General cannot be renamed or deleted, and its name is reserved for user tabs.

---

## ADR-006 — The database renumbers notes when one is moved

All notes of an account have one order, stored in `notes.position`; each tab shows its own
notes in that order. A move sends only its intent, "place this note right after that one",
to the `reorder_note` function, which renumbers the account's notes from the database's
current order in one transaction.

Reason:
A client that saved its whole list could silently undo a move made on another device from
an outdated list. Renumbering on the server keeps positions whole numbers without gaps, so
there is always room to place a note between two others.

Consequence:
Only `reorder_note` and the column default for new notes change positions; saving a note
never sends its position. A move may rewrite the positions of all the account's notes.

