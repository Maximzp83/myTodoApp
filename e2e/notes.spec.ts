import { test, expect, login } from './fixtures/cloud.js'

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

test('creates, saves with a button, guards unsaved edits, and deletes notes', async ({
  page,
  cloud,
}) => {
  await page.getByRole('link', { name: 'Notes', exact: true }).click()
  await expect(page).toHaveURL(/#\/notes$/)
  await expect(page.getByText('No notes yet.')).toBeVisible()

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Note text' })
  const save = page.getByRole('button', { name: 'Save', exact: true })
  await expect(editor).toBeFocused()
  await expect(save).toBeDisabled()
  await editor.fill('Shopping list\nbread')
  await expect(page.getByRole('status')).toHaveText('Unsaved changes')
  // Leaving the editor does not save.
  await editor.blur()
  await expect(page.getByRole('status')).toHaveText('Unsaved changes')
  expect(cloud.notes[0]?.body).toBe('')
  await save.click()
  await expect(page.getByRole('status')).toHaveText('All changes saved')
  await expect(save).toBeDisabled()
  expect(cloud.notes[0]?.body).toBe('Shopping list\nbread')

  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Empty note/ })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await editor.fill('Ideas')
  await editor.press('ControlOrMeta+s')
  await expect(page.getByRole('status')).toHaveText('All changes saved')

  // Declining the prompt keeps the unsaved draft; accepting it discards the draft.
  await editor.fill('Ideas, unsaved')
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('button', { name: /^Shopping list/ }).click()
  await expect(editor).toHaveValue('Ideas, unsaved')
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: /^Shopping list/ }).click()
  await expect(editor).toHaveValue('Shopping list\nbread')

  await page.reload()
  await expect(page.getByRole('list', { name: 'Notes' }).getByRole('listitem')).toHaveCount(2)
  await page.getByRole('button', { name: /^Ideas/ }).click()
  await expect(editor).toHaveValue('Ideas')
  await page.getByRole('button', { name: 'Delete note', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Ideas/ })).toHaveCount(0)
  await expect(editor).toHaveValue('Shopping list\nbread')
  expect(cloud.notes).toHaveLength(1)

  await editor.fill('Leaving')
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await expect(page.getByLabel('New Todo', { exact: true })).toBeVisible()
  expect(cloud.notes[0]?.body).toBe('Shopping list\nbread')
})
