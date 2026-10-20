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

The Notes page (`#/notes`) groups standalone notes into tabs.

### Tabs

- The built-in General tab always exists, comes first, and cannot be renamed or deleted.
- Users can create tabs with a name of up to 50 characters. Names are trimmed and unique
  regardless of letter case; "General" is reserved.
- Users can rename and delete their tabs. Deleting a tab moves its notes to General.
- The page opens on General; the active tab is not remembered between visits.
- Notes that existed before tabs were introduced appear in General, with their text as content.

### Notes

A note has a title (up to 120 characters, may be empty), content (up to 10000 characters),
and a creation date.

The active tab lists its notes, newest first. Each item shows the title, or "Untitled note"
when the title is empty, and the creation date in the user's local format.

### Note dialog

- Clicking a note opens a modal dialog with its title, content, and creation date.
  The title and content are edited directly in the dialog.
- In the edit dialog, the Tab field moves the note to another tab or to General when saved.
  Notes can change tabs only there; a new note is always created in the active tab.
- "New note" opens the same dialog for a new note in the active tab. The note is stored
  only when it is saved, so cancelling leaves nothing behind.
- Save (or Ctrl/Cmd+S) stores the changes and closes the dialog. If saving fails, the dialog
  stays open with the draft and shows the error.
- Delete note asks for confirmation.
- Escape and Cancel close the dialog; with unsaved changes they ask for confirmation first.
  Closing or reloading the browser tab with unsaved changes also asks for confirmation.
- Focus stays inside the open dialog and returns to the note when it closes
  (to "New note" when the note was deleted or not created).
