import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoItem from '@/components/TodoItem.vue'
import { formatTodoDate, TodoPriorityId, type Todo } from '@/types/todo'

const todo: Todo = {
  id: 'todo-1',
  title: 'Write report',
  completed: false,
  createdAt: '2026-08-14T12:00:00.000Z',
  priorityId: TodoPriorityId.Normal,
  categoryId: null,
  note: null,
}

describe('TodoItem', () => {
  it('shows the local creation date of the task', () => {
    const wrapper = mount(TodoItem, { props: { todo, categories: [], toggling: false } })
    const date = wrapper.get('time')
    expect(date.attributes('datetime')).toBe(todo.createdAt)
    expect(date.text()).toBe(formatTodoDate(todo.createdAt))
  })
})
