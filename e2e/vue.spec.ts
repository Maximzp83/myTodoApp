import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('manages, filters, and persists Todos', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'My Todos' })).toBeVisible()

  const input = page.getByLabel('New Todo')
  await input.fill('  First task  ')
  await page.getByLabel('Priority').selectOption({ label: 'Critical' })
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

  const firstTodo = page.getByRole('checkbox', { name: 'First task' })
  await firstTodo.check()
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
