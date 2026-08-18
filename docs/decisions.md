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