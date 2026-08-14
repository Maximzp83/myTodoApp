import { beforeEach, describe, expect, it } from 'vitest'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import type { Todo } from '@/types/todo'

describe('todoStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty array when no Todos are stored', () => {
    expect(loadTodos()).toEqual([])
  })

  it('returns an empty array when the stored JSON is malformed', () => {
    localStorage.setItem('todos', '{not valid JSON')

    expect(loadTodos()).toEqual([])
  })

  it('returns an empty array when the stored value is not a Todo array', () => {
    localStorage.setItem('todos', JSON.stringify([{ id: 1, title: 'Invalid Todo' }]))

    expect(loadTodos()).toEqual([])
  })

  it('saves and loads Todos', () => {
    const todos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Test persistence',
        completed: false,
        createdAt: '2026-08-14T12:00:00.000Z',
      },
    ]

    saveTodos(todos)

    expect(loadTodos()).toEqual(todos)
  })
})
