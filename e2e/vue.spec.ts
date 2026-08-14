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
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await input.fill('Second task')
  await page.getByRole('button', { name: 'Add Todo' }).click()

  await expect(page.getByText('First task', { exact: true })).toBeVisible()
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()
  await expect(page.getByText('2 items left')).toBeVisible()

  await page.getByRole('checkbox', { name: 'First task' }).check()
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
  await expect(page.getByText('Second task', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Second task' }).click()
  await page.getByRole('button', { name: 'Clear completed' }).click()

  await expect(page.getByRole('list', { name: 'Todo list' })).toHaveCount(0)
  await expect(page.getByText('0 items left')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear completed' })).toHaveCount(0)
})

test('prevents empty and overlong Todo titles', async ({ page }) => {
  const input = page.getByLabel('New Todo')
  const addButton = page.getByRole('button', { name: 'Add Todo' })

  await expect(addButton).toBeDisabled()
  await input.fill('   ')
  await expect(addButton).toBeDisabled()
  await expect(input).toHaveAttribute('maxlength', '120')
})
