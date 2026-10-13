# Architecture

UI

    ↓

Vue Components

    ↓

Pinia Store / Composables

    ↓

Services

    ↓

Browser APIs

## Components

Components are responsible for rendering and user interaction.

They should not directly access browser persistence.

## Store

The Todo Pinia store owns the Todo collection, including task notes.

The Notes Pinia store owns standalone notes.

Both expose actions for modifying their state.

## Routing

`src/router` maps `#/` to the task workspace and `#/notes` to the Notes page.
Hash history is used because GitHub Pages has no fallback for unknown paths.

## Services

todoStorage.ts is responsible for reading and writing Todo data to localStorage.

## Composables

Composable functions contain reusable reactive or derived behavior.

## Types

Shared domain types belong in src/types.

Small runtime guards that validate persisted domain values belong alongside their domain types.
