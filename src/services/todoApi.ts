import type { PostgrestError } from '@supabase/supabase-js'
import { getSupabase } from '@/services/supabase'
import { loadTodos } from '@/services/todoStorage'
import { loadCategories } from '@/services/categoryStorage'
import type { TodoCategory, TodoCategoryFilter } from '@/types/category'
import type { TodoRow } from '@/types/database'
import { isTodoPriorityId, type Todo, type TodoPriorityId } from '@/types/todo'

function toTodo(row: TodoRow): Todo {
  if (!isTodoPriorityId(row.priority_id)) throw new Error('A task has an unsupported priority.')
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    priorityId: row.priority_id,
    categoryId: row.category_id,
  }
}

async function allRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) throw error
    if (!data) throw new Error('Could not load your data.')
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

export async function fetchAccountData(userId: string) {
  const client = getSupabase()
  const [categoryRows, todoRows] = await Promise.all([
    allRows((from, to) =>
      client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
        .order('id')
        .range(from, to),
    ),
    allRows((from, to) =>
      client
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
        .order('id')
        .range(from, to),
    ),
  ])
  return {
    categories: categoryRows.map(({ id, name }) => ({ id, name })),
    todos: todoRows.map(toTodo),
  }
}

export async function createCategory(userId: string, name: string): Promise<TodoCategory> {
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, name: data.name }
}

export async function createTodo(
  userId: string,
  title: string,
  priorityId: TodoPriorityId,
  categoryId: string | null,
) {
  const { data, error } = await getSupabase()
    .from('todos')
    .insert({ user_id: userId, title, priority_id: priorityId, category_id: categoryId })
    .select()
    .single()
  if (error) throw error
  return toTodo(data)
}

export async function updateTodo(
  userId: string,
  id: string,
  changes: { completed?: boolean; category_id?: string | null },
) {
  const { data, error } = await getSupabase()
    .from('todos')
    .update(changes)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toTodo(data)
}

export async function deleteTodo(userId: string, id: string) {
  const { data, error } = await getSupabase()
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
    .select('id')
  if (error) throw error
  return data.map((row) => row.id)
}

export async function deleteCompleted(userId: string, categoryId: TodoCategoryFilter) {
  let query = getSupabase().from('todos').delete().eq('user_id', userId).eq('completed', true)
  if (categoryId === null) query = query.is('category_id', null)
  else if (categoryId !== undefined) query = query.eq('category_id', categoryId)
  const { data, error } = await query.select('id')
  if (error) throw error
  return data.map((row) => row.id)
}

export function hasBrowserData() {
  return loadTodos().length > 0 || loadCategories().length > 0
}

export async function importBrowserData(userId: string) {
  const localCategories = loadCategories()
  const categoryIds = new Map(localCategories.map((category) => [category.id, crypto.randomUUID()]))
  const categoryRows = localCategories.map((category) => ({
    id: categoryIds.get(category.id) ?? crypto.randomUUID(),
    name: category.name,
  }))
  const todoRows = loadTodos().map((todo) => ({
    id: crypto.randomUUID(),
    title: todo.title,
    completed: todo.completed,
    created_at: todo.createdAt,
    priority_id: todo.priorityId,
    category_id: todo.categoryId ? (categoryIds.get(todo.categoryId) ?? null) : null,
  }))
  const { error } = await getSupabase().rpc('import_browser_data', {
    expected_user_id: userId,
    category_rows: categoryRows,
    todo_rows: todoRows,
  })
  if (error) throw error
}
