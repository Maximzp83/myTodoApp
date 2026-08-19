export enum TodoPriorityId {
  Low = 1,
  Normal = 2,
  High = 3,
  Critical = 4,
}

export interface TodoPriorityOption {
  readonly id: TodoPriorityId
  readonly label: string
}

export const prioritiesList = [
  { id: TodoPriorityId.Low, label: 'Low' },
  { id: TodoPriorityId.Normal, label: 'Normal' },
  { id: TodoPriorityId.High, label: 'High' },
  { id: TodoPriorityId.Critical, label: 'Critical' },
] as const satisfies readonly TodoPriorityOption[]

export function isTodoPriorityId(value: unknown): value is TodoPriorityId {
  return typeof value === 'number' && prioritiesList.some((priority) => priority.id === value)
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
  priorityId: TodoPriorityId
}

export enum TodoFilter {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}
