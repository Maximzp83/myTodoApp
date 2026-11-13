import { randomUUID } from 'node:crypto'
import { test, expect, login } from './fixtures/cloud.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await login(page)
})

test('manages, filters, and persists Todos', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'My Todos' })).toBeVisible()

  const input = page.getByLabel('New Todo')
  await input.fill('  First task  ')
  await page.getByLabel('Priority', { exact: true }).selectOption({ label: 'Critical' })
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await input.fill('Second task')
  await page.getByRole('button', { name: 'Add Todo' }).click()

  await expect(page.getByText('First task', { exact: true })).toBeVisible()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'First task' })
      .getByText('Critical', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()
  await expect(page.getByText('2 items left')).toBeVisible()

  await page.getByRole('button', { name: 'Critical', exact: true }).click()
  await expect(page.getByText('First task', { exact: true })).toBeVisible()
  await expect(page.getByText('Second task', { exact: true })).toBeHidden()

  await page.getByRole('button', { name: 'Normal', exact: true }).click()
  await expect(page.getByText('First task', { exact: true })).toBeHidden()
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'All priorities', exact: true }).click()

  const firstTodo = page.getByRole('checkbox', { name: 'First task' })
  await firstTodo.click()
  await expect(firstTodo).toBeChecked()
  await expect(page.getByText('1 item left')).toBeVisible()

  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(page.getByText('First task', { exact: true })).toBeHidden()
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(page.getByText('First task', { exact: true })).toBeVisible()
  await expect(page.getByText('Second task', { exact: true })).toBeHidden()

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'First task' })).toBeChecked()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'First task' })
      .getByText('Critical', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Second task' }).click()
  await expect(page.getByText('Second task', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear completed' }).click()

  await expect(page.getByRole('list', { name: 'Todo list' })).toHaveCount(0)
  await expect(page.getByText('0 items left')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear completed' })).toHaveCount(0)
})

test('sorts tasks by creation date, oldest first by default', async ({ page, cloud }) => {
  const userId = cloud.users[0]?.id ?? ''
  const seeded = [
    ['Middle task', '2025-01-02T10:00:00.000Z', false],
    ['Newest task', '2025-01-03T10:00:00.000Z', true],
    ['Oldest task', '2025-01-01T10:00:00.000Z', false],
  ] as const
  for (const [title, createdAt, completed] of seeded)
    cloud.todos.push({
      id: randomUUID(),
      user_id: userId,
      title,
      completed,
      created_at: createdAt,
      priority_id: 2,
      category_id: null,
      note: null,
    })
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()

  const items = page.getByRole('list', { name: 'Todo list' }).getByRole('listitem')
  await expect(items).toHaveCount(3)
  await expect(items).toContainText(['Oldest task', 'Middle task', 'Newest task'])
  const expectedDate = await page.evaluate(
    (createdAt) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(createdAt)),
    '2025-01-01T10:00:00.000Z',
  )
  await expect(items.first().locator('time')).toHaveText(expectedDate)

  const sort = page.getByLabel('Sort', { exact: true })
  await sort.selectOption({ label: 'Newest first' })
  await expect(items).toContainText(['Newest task', 'Middle task', 'Oldest task'])
  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(items).toHaveCount(2)
  await expect(items).toContainText(['Middle task', 'Oldest task'])

  await page.reload()
  await expect(sort.locator('option:checked')).toHaveText('Oldest first')
  await page.getByLabel('New Todo').fill('Fresh task')
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await expect(items).toHaveCount(4)
  await expect(items).toContainText(['Oldest task', 'Middle task', 'Newest task', 'Fresh task'])
})
