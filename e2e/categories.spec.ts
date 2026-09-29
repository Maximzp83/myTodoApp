import { test, expect, type Page } from '@playwright/test'

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
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
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
  await page.getByRole('checkbox', { name: 'Completed work task' }).check()
  await addTodo(page, 'Active work task')

  await createCategory(page, 'Personal')
  await addTodo(page, 'Completed personal task')
  await page.getByRole('checkbox', { name: 'Completed personal task' }).check()

  await page.getByRole('tab', { name: 'Work', exact: true }).click()
  await expect(page.getByText('1 item left', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Clear completed', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Completed work task' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Active work task' })).toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Personal', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Completed personal task' })).toBeChecked()
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
