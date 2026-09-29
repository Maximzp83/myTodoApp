import { randomUUID } from 'node:crypto'
import { test as base, expect, type BrowserContext, type Page } from '@playwright/test'
import type { CategoryRow, TodoRow } from '../../src/types/database.js'

type TestUser = { id: string; email: string; password: string; confirmed: boolean }
type RecordValue = Record<string, unknown>

function record(value: unknown): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Expected JSON object')
  return value as RecordValue
}

function records(value: unknown): RecordValue[] {
  if (!Array.isArray(value)) throw new Error('Expected JSON array')
  return value.map(record)
}

function matching(row: RecordValue, params: URLSearchParams) {
  for (const [key, value] of params) {
    if (value.startsWith('eq.') && String(row[key]) !== value.slice(3)) return false
    if (value === 'is.null' && row[key] !== null) return false
  }
  return true
}

// Test-only intercepted API. No request reaches a real Supabase project.
export class TestCloud {
  private toggleGates = new Map<string, Promise<void>>()

  holdTodoToggle(title: string) {
    const todo = this.todos.find((item) => item.title === title)
    if (!todo) throw new Error('Expected task to delay')
    const { promise, resolve } = Promise.withResolvers<void>()
    this.toggleGates.set(todo.id, promise)
    return () => {
      this.toggleGates.delete(todo.id)
      resolve()
    }
  }

  confirm(email: string) {
    const user = this.users.find((item) => item.email === email)
    if (!user) throw new Error('Expected registered user')
    user.confirmed = true
  }
  users: TestUser[] = [
    { id: randomUUID(), email: 'test@example.com', password: 'password123', confirmed: true },
  ]
  todos: TodoRow[] = []
  categories: CategoryRow[] = []
  failWrites = false

  async install(context: BrowserContext) {
    await context.route('https://todo-e2e.invalid/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const method = request.method()
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
      const respond = (body: unknown, status = 200) =>
        route.fulfill({
          status,
          headers,
          contentType: 'application/json',
          body: JSON.stringify(body),
        })
      if (method === 'OPTIONS') {
        await respond({})
        return
      }
      const body = request.postData() ? record(JSON.parse(request.postData() ?? '{}')) : {}
      const bearer = request.headers().authorization?.replace('Bearer ', '') ?? ''
      const actor = this.users.find((user) => {
        const payload = bearer.split('.')[1]
        if (!payload) return false
        try {
          return record(JSON.parse(Buffer.from(payload, 'base64url').toString())).sub === user.id
        } catch {
          return false
        }
      })

      if (url.pathname === '/auth/v1/signup') {
        let user = this.users.find((item) => item.email === body.email)
        if (!user) {
          user = {
            id: randomUUID(),
            email: String(body.email),
            password: String(body.password),
            confirmed: false,
          }
          this.users.push(user)
        }
        await respond(this.userResponse(user))
        return
      }
      if (url.pathname === '/auth/v1/token') {
        const user = this.users.find((item) =>
          url.searchParams.get('grant_type') === 'refresh_token'
            ? body.refresh_token === `refresh-${item.id}`
            : item.email === body.email && item.password === body.password,
        )
        if (!user) {
          await respond({ message: 'Invalid login credentials' }, 400)
          return
        }
        if (!user.confirmed) {
          await respond({ message: 'Email not confirmed' }, 400)
          return
        }
        await respond(this.session(user))
        return
      }
      if (url.pathname === '/auth/v1/logout') {
        await route.fulfill({ status: 204, headers })
        return
      }
      if (url.pathname === '/auth/v1/user') {
        await respond(
          actor ? this.userResponse(actor) : { message: 'Unauthorized' },
          actor ? 200 : 401,
        )
        return
      }
      if (!actor) {
        await respond({ message: 'Unauthorized' }, 401)
        return
      }
      if (
        url.pathname === '/rest/v1/todos' &&
        method === 'PATCH' &&
        typeof body.completed === 'boolean'
      ) {
        const id = url.searchParams.get('id')?.replace(/^eq\./, '') ?? ''
        await this.toggleGates.get(id)
      }
      if (method !== 'GET' && this.failWrites) {
        await respond({ message: 'Simulated save failure' }, 500)
        return
      }
      const single = request.headers().accept?.includes('application/vnd.pgrst.object+json')

      if (url.pathname === '/rest/v1/rpc/import_browser_data') {
        if (body.expected_user_id !== actor.id) {
          await respond({ message: 'Account changed' }, 403)
          return
        }
        if (
          this.todos.some((todo) => todo.user_id === actor.id) ||
          this.categories.some((category) => category.user_id === actor.id)
        ) {
          await respond({ message: 'Import is available only for an empty account.' }, 400)
          return
        }
        for (const category of records(body.category_rows))
          this.categories.push({
            id: String(category.id),
            user_id: actor.id,
            name: String(category.name),
            created_at: new Date().toISOString(),
          })
        for (const todo of records(body.todo_rows)) this.todos.push(this.todoRow(todo, actor.id))
        await respond(null)
        return
      }
      if (url.pathname === '/rest/v1/categories') {
        if (method === 'POST') {
          if (body.user_id !== actor.id) {
            await respond({ message: 'Forbidden' }, 403)
            return
          }
          const category = {
            id: randomUUID(),
            user_id: actor.id,
            name: String(body.name),
            created_at: new Date().toISOString(),
          }
          this.categories.push(category)
          await respond(single ? category : [category])
          return
        }
        const selected = this.categories.filter(
          (category) =>
            category.user_id === actor.id && matching({ ...category }, url.searchParams),
        )
        if ((method === 'PATCH' || method === 'DELETE') && single && selected.length !== 1) {
          await respond({ message: 'Category is no longer available' }, 406)
          return
        }
        if (method === 'PATCH') {
          const duplicate = this.categories.some(
            (category) =>
              category.user_id === actor.id &&
              !selected.includes(category) &&
              category.name.toLowerCase() === String(body.name).toLowerCase(),
          )
          if (duplicate) {
            await respond({ message: 'A category with this name already exists.' }, 409)
            return
          }
          for (const category of selected) category.name = String(body.name)
        }
        if (method === 'DELETE') {
          this.categories = this.categories.filter((category) => !selected.includes(category))
          const deletedIds = new Set(selected.map((category) => category.id))
          for (const todo of this.todos)
            if (todo.user_id === actor.id && todo.category_id && deletedIds.has(todo.category_id))
              todo.category_id = null
        }
        await respond(single ? selected[0] : selected)
        return
      }
      if (url.pathname === '/rest/v1/todos') {
        if (method === 'POST') {
          if (body.user_id !== actor.id) {
            await respond({ message: 'Forbidden' }, 403)
            return
          }
          const todo = this.todoRow(body, actor.id)
          this.todos.push(todo)
          await respond(single ? todo : [todo])
          return
        }
        const selected = this.todos.filter(
          (todo) => todo.user_id === actor.id && matching({ ...todo }, url.searchParams),
        )
        if (method === 'PATCH') {
          for (const todo of selected) {
            if (typeof body.completed === 'boolean') todo.completed = body.completed
            if ('category_id' in body)
              todo.category_id = body.category_id === null ? null : String(body.category_id)
          }
          await respond(single ? selected[0] : selected)
          return
        }
        if (method === 'DELETE') this.todos = this.todos.filter((todo) => !selected.includes(todo))
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? 1000)
        await respond(selected.slice(offset, offset + limit))
        return
      }
      await respond({ message: 'Unknown mock endpoint' }, 404)
    })
  }

  private userResponse(user: TestUser) {
    return {
      id: user.id,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
    }
  }

  private session(user: TestUser) {
    const expires = Math.floor(Date.now() / 1000) + 3600
    const encode = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64url')
    return {
      access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: expires })}.test`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expires,
      refresh_token: `refresh-${user.id}`,
      user: this.userResponse(user),
    }
  }

  private todoRow(value: RecordValue, userId: string): TodoRow {
    return {
      id: typeof value.id === 'string' ? value.id : randomUUID(),
      user_id: userId,
      title: String(value.title),
      completed: value.completed === true,
      created_at:
        typeof value.created_at === 'string' ? value.created_at : new Date().toISOString(),
      priority_id: Number(value.priority_id ?? 2),
      category_id: typeof value.category_id === 'string' ? value.category_id : null,
    }
  }
}

export async function login(page: Page, email = 'test@example.com', password = 'password123') {
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click()
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled()
}

export const test = base.extend<{ cloud: TestCloud }>({
  cloud: [
    async ({ context }, use) => {
      const cloud = new TestCloud()
      await cloud.install(context)
      await use(cloud)
    },
    { auto: true },
  ],
})
export { expect }
