export enum TodoPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Critical = 'critical',
}

const todoPriorityValues: readonly unknown[] = Object.values(TodoPriority)

export function isTodoPriority(value: unknown): value is TodoPriority {
  return todoPriorityValues.includes(value)
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
  priority: TodoPriority
}

export enum TodoFilter {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}
