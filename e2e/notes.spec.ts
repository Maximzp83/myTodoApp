import type { Page } from '@playwright/test'
import { test, expect, login } from './fixtures/cloud.js'

async function openNotes(page: Page) {
  await page.getByRole('link', { name: 'Notes', exact: true }).click()
  await expect(page).toHaveURL(/#\/notes$/)
  await expect(page.getByRole('button', { name: 'New note', exact: true })).toBeEnabled()
}

async function createTab(page: Page, name: string) {
  await page.getByLabel('New tab', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'Create tab', exact: true }).click()
  await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
}

async function createNote(page: Page, title: string, content: string) {
  await page.getByRole('button', { name: 'New note', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'New note' })
  await dialog.getByLabel('Title', { exact: true }).fill(title)
  await dialog.getByLabel('Content', { exact: true }).fill(content)
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: new RegExp(`^${title}`) })).toBeFocused()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await login(page)
})

test('adds, edits, and deletes a task note in a dialog', async ({ page, cloud }) => {
  await page.getByLabel('New Todo', { exact: true }).fill('Buy milk')
  await page.getByRole('button', { name: 'Add Todo', exact: true }).click()
  await page.getByRole('button', { name: 'Add note to Buy milk', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Buy milk' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Note' }).fill('Two liters,\nlactose free')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toBeHidden()
  const noteButton = page.getByRole('button', { name: 'Note for Buy milk', exact: true })
  await expect(noteButton).toBeFocused()
  expect(cloud.todos[0]?.note).toBe('Two liters,\nlactose free')

  await page.reload()
  await noteButton.click()
  await expect(dialog.getByRole('textbox', { name: 'Note' })).toHaveValue(
    'Two liters,\nlactose free',
  )
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await noteButton.click()
  await dialog.getByRole('button', { name: 'Delete note', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Add note to Buy milk' })).toBeAttached()
  expect(cloud.todos[0]?.note).toBeNull()
})

test('keeps existing notes in General and isolates notes by tab', async ({ page, cloud }) => {
  cloud.notes.push({
    id: crypto.randomUUID(),
    user_id: cloud.users[0]?.id ?? '',
    title: '',
    body: 'Written before tabs existed',
    tab_id: null,
    created_at: '2026-10-01T09:00:00.000Z',
  })
  await openNotes(page)
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()

  await expect(page.getByRole('tab', { name: 'General', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const legacyNote = page.getByRole('button', { name: /^Untitled note/ })
  await legacyNote.click()
  const legacyDialog = page.getByRole('dialog', { name: 'Untitled note' })
  await expect(legacyDialog.getByLabel('Content', { exact: true })).toHaveValue(
    'Written before tabs existed',
  )
  await page.keyboard.press('Escape')
  await expect(legacyDialog).toBeHidden()
  await expect(legacyNote).toBeFocused()

  await createTab(page, 'Ideas')
  await expect(page.getByText('No notes in this tab yet.')).toBeVisible()
  await createNote(page, 'Weekend plan', 'Hike\nCinema')
  const savedNote = cloud.notes.find((note) => note.title === 'Weekend plan')
  expect(savedNote?.tab_id).toBe(cloud.noteTabs[0]?.id)

  const noteButton = page.getByRole('button', { name: /^Weekend plan/ })
  await noteButton.click()
  const dialog = page.getByRole('dialog', { name: 'Weekend plan' })
  await expect(dialog.getByLabel('Title', { exact: true })).toHaveValue('Weekend plan')
  await expect(dialog.getByLabel('Content', { exact: true })).toHaveValue('Hike\nCinema')
  const expectedDate = await page.evaluate(
    (createdAt) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(createdAt)),
    savedNote?.created_at ?? '',
  )
  await expect(dialog.locator('time')).toHaveText(expectedDate)
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(noteButton).toBeFocused()

  await page.getByRole('tab', { name: 'General', exact: true }).click()
  await expect(legacyNote).toBeVisible()
  await expect(noteButton).toHaveCount(0)
  await page.getByRole('tab', { name: 'Ideas', exact: true }).click()
  await expect(noteButton).toBeVisible()
  await expect(legacyNote).toHaveCount(0)

  await page.reload()
  await page.getByRole('tab', { name: 'Ideas', exact: true }).click()
  await expect(page.getByRole('list', { name: 'Notes' }).getByRole('listitem')).toHaveCount(1)
  await expect(noteButton).toBeVisible()
})

test('edits a note in the dialog, guards unsaved changes, and deletes it', async ({
  page,
  cloud,
}) => {
  await openNotes(page)
  await createNote(page, 'Draft', 'First version')
  const noteButton = page.getByRole('button', { name: /^Draft/ })
  await noteButton.click()
  const dialog = page.getByRole('dialog', { name: 'Draft' })
  const content = dialog.getByLabel('Content', { exact: true })

  await content.fill('Unsaved version')
  page.once('dialog', (prompt) => void prompt.dismiss())
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(content).toHaveValue('Unsaved version')
  page.once('dialog', (prompt) => void prompt.accept())
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(cloud.notes[0]?.body).toBe('First version')

  await noteButton.click()
  await expect(content).toHaveValue('First version')
  await dialog.getByLabel('Title', { exact: true }).fill('Final')
  await content.fill('Second version')
  await content.press('ControlOrMeta+s')
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(cloud.notes[0]).toMatchObject({ title: 'Final', body: 'Second version' })

  const finalButton = page.getByRole('button', { name: /^Final/ })
  await expect(finalButton).toBeFocused()
  await finalButton.click()
  page.once('dialog', (prompt) => void prompt.accept())
  await page.getByRole('button', { name: 'Delete note', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(finalButton).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'New note', exact: true })).toBeFocused()
  expect(cloud.notes).toHaveLength(0)
})

test('renames a tab and moves its notes to General when it is deleted', async ({ page, cloud }) => {
  await openNotes(page)
  await createTab(page, 'Ideas')
  await createNote(page, 'Idea one', 'Details')

  await page.getByRole('tab', { name: 'Ideas', exact: true }).hover()
  await page.getByRole('button', { name: 'Manage tab Ideas', exact: true }).click()
  await page.getByRole('button', { name: 'Edit tab', exact: true }).click()
  await page.getByLabel('Tab name', { exact: true }).fill('General')
  await expect(page.getByRole('status')).toHaveText('A tab with this name already exists.')
  await page.getByLabel('Tab name', { exact: true }).fill('Plans')
  await page.getByRole('button', { name: 'Save tab', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Plans', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(cloud.noteTabs[0]?.name).toBe('Plans')

  await page.getByRole('button', { name: 'Delete tab', exact: true }).click()
  await expect(page.getByText('Delete “Plans”? Its notes will move to General.')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm delete tab', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Plans' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'General', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('button', { name: /^Idea one/ })).toBeVisible()
  expect(cloud.noteTabs).toHaveLength(0)
  expect(cloud.notes[0]?.tab_id).toBeNull()

  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await expect(page.getByLabel('New Todo', { exact: true })).toBeVisible()
})
