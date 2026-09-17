# Todo Application Requirements

## Todo

A Todo has:

- id
- title
- completed state
- creation timestamp
- priority: low, normal, high, or critical

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
