# Todo Codex Project

## Project purpose

This is a learning project for experimenting with AI-assisted Vue development.

The application is a Todo application built with:

- Vue 3
- TypeScript
- Composition API
- `<script setup>`
- Pinia
- Vitest
- Playwright
- ESLint
- Prettier

## Architecture

Use the following layers:

- `src/components` — UI components
- `src/stores` — Pinia state and actions
- `src/composables` — reusable reactive logic
- `src/services` — browser persistence and external side effects
- `src/types` — shared TypeScript types

Do not mix responsibilities between these layers.

## Vue rules

Always use:

- Vue 3 Composition API
- `<script setup lang="ts">`
- TypeScript
- typed props
- typed emits

Prefer TypeScript inference when the type is obvious.

Do not add explicit types when TypeScript can infer them clearly.

Do not use the Options API.

## Component rules

Components should primarily handle presentation and user interaction.

Do not access localStorage directly from Vue components.

Do not put reusable business logic directly inside components.

Extract reusable reactive logic into composables.

Components should have a clear single responsibility.

Do not split components only to reduce line count.

## TypeScript rules

Avoid `any`.

Do not use `as any` to bypass type errors.

Prefer interfaces or simple type aliases over complicated generic types.

Do not weaken TypeScript configuration to make errors disappear.

Fix the actual type error instead.

## State management

Shared Todo state belongs in the Pinia store.

Do not duplicate Todo state between components and the store.

Persistence belongs in the service layer.

## Testing

When changing application behavior:

- add or update tests when appropriate
- run unit tests
- run TypeScript checks
- run ESLint

For user-facing flows, update Playwright tests when appropriate.

Tests should verify behavior rather than implementation details.

## Dependencies

Do not add production dependencies unless they are necessary.

Prefer Vue and browser platform APIs before adding another library.

## Verification

Before considering a task complete, run the relevant checks:

- type checking
- lint
- unit tests

For UI or user-flow changes, also run E2E tests when appropriate.

Do not ignore failing checks.

## Working style

Before implementing a non-trivial task:

1. inspect the relevant existing files
2. explain the intended change briefly
3. implement the smallest reasonable solution
4. run relevant checks
5. review the resulting diff

Avoid unrelated refactoring.

Do not rewrite working files unnecessarily.
