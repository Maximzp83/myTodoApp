import type { Page } from '@playwright/test'
import { test, expect, login } from './fixtures/cloud.js'

async function createCategory(page: Page, name: string) {
  await page.getByLabel('New category', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'Create category', exact: true }).click()
  await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
}

async function addTodo(page: Page, title: string) {
  await page.getByLabel('New Todo', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Add Todo', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: title, exact: true })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await login(page)
})

test('creates category tabs, assigns and moves tasks, and persists them', async ({
  page,
}, testInfo) => {
  await addTodo(page, 'Existing uncategorized task')
  await createCategory(page, 'Work')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue(/.+/)
  await page.getByLabel('Priority', { exact: true }).selectOption({ label: 'High' })
  await addTodo(page, 'Work task')
  await expect(page.getByRole('checkbox', { name: 'Work task', exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toHaveCount(0)

  await createCategory(page, 'Personal')
  await addTodo(page, 'Personal task')
  await expect(page.getByRole('checkbox', { name: 'Work task', exact: true })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Uncategorized', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toBeVisible()
  await page.getByLabel('Category for Existing uncategorized task').selectOption({ label: 'Work' })
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Work', exact: true }).click()
  await expect(page.getByText('2 items left', { exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toBeVisible()
  await page.getByRole('button', { name: 'High', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Work task', exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toHaveCount(0)

  await page.reload()
  await page.getByRole('tab', { name: 'Work', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Work task', exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Existing uncategorized task' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Personal task', exact: true })).toHaveCount(0)

  await page.getByLabel('Category for Work task').selectOption({ label: 'Uncategorized' })
  await page.getByRole('tab', { name: 'Uncategorized', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Work task', exact: true })).toBeVisible()

  await page.getByLabel('New category').fill('  wOrK  ')
  await expect(page.getByRole('status')).toHaveText('A category with this name already exists.')
  await expect(page.getByRole('button', { name: 'Create category' })).toBeDisabled()
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveCount(1)
  await page.getByLabel('New category').clear()

  await page.getByRole('tab', { name: 'All tasks', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('categories-desktop-light.png'),
    animations: 'disabled',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Enable dark theme' }).click()
  await page.screenshot({
    path: testInfo.outputPath('categories-desktop-dark.png'),
    animations: 'disabled',
    fullPage: true,
  })
})

test('clears completed tasks only in the selected category', async ({ page }) => {
  await createCategory(page, 'Work')
  await addTodo(page, 'Completed work task')
  await page.getByRole('checkbox', { name: 'Completed work task' }).click()
  await addTodo(page, 'Active work task')

  await createCategory(page, 'Personal')
  await addTodo(page, 'Completed personal task')
  await page.getByRole('checkbox', { name: 'Completed personal task' }).click()

  await page.getByRole('tab', { name: 'Work', exact: true }).click()
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear completed', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Completed work task' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Active work task' })).toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Personal', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Completed personal task' })).toBeChecked()
})

test('renames and deletes a category while preserving its tasks', async ({ page }, testInfo) => {
  await createCategory(page, 'Work')
  await page.getByLabel('Priority', { exact: true }).selectOption({ label: 'Critical' })
  await addTodo(page, 'Finished work task')
  await page.getByRole('checkbox', { name: 'Finished work task' }).click()
  await expect(page.getByRole('checkbox', { name: 'Finished work task' })).toBeChecked()
  await addTodo(page, 'Active work task')
  await createCategory(page, 'Personal')
  await addTodo(page, 'Personal task')
  await page.getByRole('tab', { name: 'Work', exact: true }).click()

  await page.getByRole('button', { name: 'Edit category', exact: true }).click()
  const categoryName = page.getByLabel('Category name', { exact: true })
  await expect(categoryName).toBeFocused()
  await expect(categoryName).toHaveValue('Work')
  await expect(page.getByRole('button', { name: 'Save category' })).toBeDisabled()
  await categoryName.fill('  pErSoNaL  ')
  await expect(page.getByRole('status')).toHaveText('A category with this name already exists.')
  await expect(page.getByRole('button', { name: 'Save category' })).toBeDisabled()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit category' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await page.getByRole('button', { name: 'Edit category', exact: true }).click()
  await categoryName.fill('  Projects  ')
  await page.getByRole('button', { name: 'Save category', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Edit category' })).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'Finished work task' })).toBeChecked()
  await page.reload()
  await page.getByRole('tab', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Active work task' })).toBeVisible()
  await expect(page.getByLabel('Category for Finished work task')).toHaveValue(/.+/)

  await page.getByRole('button', { name: 'Delete category', exact: true }).click()
  await expect(
    page.getByText('Delete “Projects”? Its tasks will be kept in Uncategorized.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Cancel', exact: true }).press('Escape')
  await expect(page.getByRole('button', { name: 'Delete category', exact: true })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await page.getByRole('button', { name: 'Delete category', exact: true }).click()
  await page.setViewportSize({ width: 320, height: 812 })
  await page.getByRole('button', { name: 'Enable dark theme' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({
    path: testInfo.outputPath('category-delete-mobile-dark.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Confirm delete category', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Uncategorized', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('tabpanel')).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'Finished work task' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Active work task' })).toBeVisible()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Finished work task' })
      .getByText('Critical', { exact: true }),
  ).toBeVisible()
  await expect(page.getByLabel('Category for Finished work task')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Edit category' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Personal task' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Uncategorized', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Finished work task' })).toBeChecked()
  await page.getByRole('tab', { name: 'Personal', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Personal task' })).toBeVisible()
})

test('keeps rename drafts and category tasks after failed saves', async ({
  page,
  cloud,
}, testInfo) => {
  await createCategory(page, 'Work')
  await addTodo(page, 'Keep this task')
  await page.getByRole('button', { name: 'Edit category', exact: true }).click()
  cloud.failWrites = true
  await page.getByLabel('Category name', { exact: true }).fill('Projects')
  await page.getByRole('button', { name: 'Save category', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Simulated save failure')
  await expect(page.getByLabel('Category name', { exact: true })).toHaveValue('Projects')
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('checkbox', { name: 'Keep this task' })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({
    path: testInfo.outputPath('category-edit-mobile-light.png'),
    fullPage: true,
    animations: 'disabled',
  })
  cloud.failWrites = false
  await page.getByRole('button', { name: 'Save category', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('button', { name: 'Delete category', exact: true }).click()
  cloud.failWrites = true
  await page.getByRole('button', { name: 'Confirm delete category', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Simulated save failure')
  await expect(page.getByRole('button', { name: 'Confirm delete category' })).toBeEnabled()
  await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('checkbox', { name: 'Keep this task' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Delete category', exact: true })).toBeVisible()
})

test('refreshes renamed or removed categories from another browser', async ({
  page,
  browser,
  cloud,
}) => {
  await createCategory(page, 'Work')
  await addTodo(page, 'Shared category task')
  const secondContext = await browser.newContext()
  try {
    await cloud.install(secondContext)
    const secondPage = await secondContext.newPage()
    await secondPage.goto(page.url())
    await login(secondPage)
    await secondPage.getByRole('tab', { name: 'Work', exact: true }).click()
    await secondPage.getByRole('button', { name: 'Edit category', exact: true }).click()
    await secondPage.getByLabel('Category name', { exact: true }).fill('Projects')
    await secondPage.getByRole('button', { name: 'Save category', exact: true }).click()
    await expect(secondPage.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByRole('tab', { name: 'Projects', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('checkbox', { name: 'Shared category task' })).toBeVisible()
    await secondPage.getByRole('button', { name: 'Delete category', exact: true }).click()
    await secondPage.getByRole('button', { name: 'Confirm delete category', exact: true }).click()
    await expect(secondPage.getByRole('tab', { name: 'Projects', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByRole('tab', { name: 'Uncategorized', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('checkbox', { name: 'Shared category task' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete category', exact: true })).toHaveCount(0)
  } finally {
    await secondContext.close()
  }
})

test('keeps legacy tasks available in the uncategorized tab', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'vue-ts-todo.todos.v2',
      JSON.stringify([
        {
          id: 'legacy-task',
          title: 'Task saved before categories',
          completed: true,
          createdAt: '2026-08-14T12:00:00.000Z',
          priorityId: 4,
        },
      ]),
    )
  })
  await page.reload()
  await page.getByRole('button', { name: 'Import browser tasks' }).click()
  await createCategory(page, 'Work')
  await page.getByRole('tab', { name: 'Uncategorized', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Task saved before categories' })).toBeChecked()
  await expect(page.getByRole('listitem').getByText('Critical', { exact: true })).toBeVisible()

  await page.getByLabel('Category for Task saved before categories').selectOption({ label: 'Work' })
  await page.reload()
  await page.getByRole('tab', { name: 'Work', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Task saved before categories' })).toBeChecked()
})

test('supports keyboard tabs and mobile layouts in both themes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await createCategory(page, 'Work')
  await addTodo(page, 'Plan the upcoming project and prepare the weekly report')
  await createCategory(page, 'Personal planning and important household projects')
  await addTodo(page, 'Pick up groceries')

  const lastTab = page.getByRole('tab', {
    name: 'Personal planning and important household projects',
    exact: true,
  })
  await lastTab.focus()
  await lastTab.press('ArrowLeft')
  const workTab = page.getByRole('tab', { name: 'Work', exact: true })
  await expect(workTab).toBeFocused()
  await expect(workTab).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('checkbox', { name: 'Plan the upcoming project and prepare the weekly report' }),
  ).toBeVisible()

  await workTab.press('Home')
  const allTab = page.getByRole('tab', { name: 'All tasks', exact: true })
  await expect(allTab).toBeFocused()
  await expect(page.getByRole('checkbox')).toHaveCount(2)
  await allTab.press('End')
  await expect(lastTab).toBeFocused()
  await expect(lastTab).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('tab', { name: 'All tasks', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('categories-mobile-light.png'),
    animations: 'disabled',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Enable dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.screenshot({
    path: testInfo.outputPath('categories-mobile-dark.png'),
    animations: 'disabled',
    fullPage: true,
  })
  await page.setViewportSize({ width: 320, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  expect(
    await page.getByRole('button', { name: 'Delete Pick up groceries' }).evaluate((button) => {
      const row = button.closest('li')
      return (
        row !== null && button.getBoundingClientRect().right <= row.getBoundingClientRect().right
      )
    }),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('categories-small-mobile-dark.png'),
    animations: 'disabled',
    fullPage: true,
  })
})
