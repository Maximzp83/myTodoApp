# Todo Application Requirements

## Todo

A Todo has:

- id
- title
- completed state
- creation timestamp
- priority: low, normal, high, or critical
- optional note (up to 2000 characters)

Default priority:

- normal

## Create Todo

Users can create a Todo using a text input.

Rules:

- trim whitespace
- empty titles are not allowed
- maximum title length is 120 characters

## Complete Todo

Users can toggle a Todo between active and completed.

## Delete Todo

Users can permanently delete a Todo.

## Filters

Available filters:

- all
- active
- completed
- low priority
- normal priority
- high priority
- critical priority

Status and priority filters can be combined.

Default filters:

- all
- all priorities

## Counter

Display the number of active Todos.

## Clear completed

Users can remove all completed Todos.

The action should not be displayed or should be disabled when there are no completed Todos.

## Persistence

Todos must persist between browser reloads using localStorage.

## Task note

Each task has a note button. When a task has a note, the button is always visible;
otherwise it appears on hover or focus (and always on touch devices).

The button opens a modal dialog where the note can be read, edited, saved, or deleted.
Saving a blank note removes it.

## Notes page

The Notes page (`#/notes`) lists standalone notes, newest first.

Users can create, edit, and delete notes. A note is plain text up to 10000 characters.

Edits are saved with the Save button or Ctrl/Cmd+S. The editor shows whether
there are unsaved changes. Switching notes, creating a note, leaving the page,
or closing the tab with unsaved changes asks for confirmation first.
