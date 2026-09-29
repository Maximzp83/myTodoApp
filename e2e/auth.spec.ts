import { test, expect, login } from './fixtures/cloud.js'

test('registers, requests email confirmation, signs in, and signs out', async ({
  page,
  cloud,
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByLabel('New Todo')).toHaveCount(0)
  await page.getByRole('button', { name: 'Register', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill('new@example.com')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Check your email to confirm your account, then sign in.',
  )
  cloud.confirm('new@example.com')
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click()
  await login(page, 'new@example.com')
  await page.getByLabel('New Todo').fill('Private task')
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await expect(page.getByRole('checkbox', { name: 'Private task' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Private task' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({
    path: testInfo.outputPath('sign-in-light.png'),
    animations: 'disabled',
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Enable dark theme' }).click()
  await page.screenshot({
    path: testInfo.outputPath('sign-in-dark.png'),
    animations: 'disabled',
    fullPage: true,
  })
})

test('shares data between separate browsers and isolates another account', async ({
  page,
  browser,
  cloud,
}) => {
  await page.goto('/')
  await login(page)
  await page.getByLabel('New Todo').fill('Task from first computer')
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await expect(page.getByRole('checkbox', { name: 'Task from first computer' })).toBeVisible()

  const secondContext = await browser.newContext()
  try {
    await cloud.install(secondContext)
    const secondPage = await secondContext.newPage()
    await secondPage.goto(page.url())
    await login(secondPage)
    await expect(
      secondPage.getByRole('checkbox', { name: 'Task from first computer' }),
    ).toBeVisible()
    await secondPage.getByLabel('New Todo').fill('Task from second computer')
    await secondPage.getByRole('button', { name: 'Add Todo' }).click()
    await expect(
      secondPage.getByRole('checkbox', { name: 'Task from second computer' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: 'Task from second computer' })).toBeVisible()

    cloud.users.push({
      id: '00000000-0000-4000-8000-000000000002',
      email: 'other@example.com',
      password: 'password123',
      confirmed: true,
    })
    await secondPage.getByRole('button', { name: 'Sign out', exact: true }).click()
    await login(secondPage, 'other@example.com')
    await expect(secondPage.getByRole('checkbox')).toHaveCount(0)
    await secondPage.getByLabel('New Todo').fill('Other account task')
    await secondPage.getByRole('button', { name: 'Add Todo' }).click()
    await expect(secondPage.getByRole('checkbox', { name: 'Other account task' })).toBeVisible()
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: 'Other account task' })).toHaveCount(0)
  } finally {
    await secondContext.close()
  }
})

test('keeps drafts and confirmed data after a failed write', async ({ page, cloud }) => {
  await page.goto('/')
  await login(page)
  cloud.failWrites = true
  await page.getByLabel('New Todo').fill('Keep my draft')
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await expect(page.getByRole('alert')).toHaveText('Simulated save failure')
  await expect(page.getByLabel('New Todo')).toHaveValue('Keep my draft')
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  cloud.failWrites = false
  await page.getByRole('button', { name: 'Add Todo' }).click()
  await expect(page.getByRole('checkbox', { name: 'Keep my draft' })).toBeVisible()
  cloud.failWrites = true
  await page.getByRole('checkbox', { name: 'Keep my draft' }).click()
  await expect(page.getByRole('alert')).toHaveText('Simulated save failure')
  await expect(page.getByRole('checkbox', { name: 'Keep my draft' })).not.toBeChecked()
})

test('toggles immediately without locking the workspace and rolls back failed toggles', async ({
  page,
  cloud,
}) => {
  await page.goto('/')
  await login(page)
  await page.getByLabel('New Todo').fill('First task')
  await page.getByRole('button', { name: 'Add Todo', exact: true }).click()
  const first = page.getByRole('checkbox', { name: 'First task', exact: true })
  await expect(first).toBeVisible()
  await page.getByLabel('New Todo').fill('Second task')
  await page.getByRole('button', { name: 'Add Todo', exact: true }).click()
  const second = page.getByRole('checkbox', { name: 'Second task', exact: true })
  await expect(second).toBeVisible()
  const releaseFirst = cloud.holdTodoToggle('First task')
  try {
    await first.click()
    await expect(first).toBeChecked()
    await expect(first).toBeDisabled()
    await expect(second).toBeEnabled()
    await expect(page.getByLabel('New Todo')).toBeEnabled()
    await expect(page.getByLabel('New category', { exact: true })).toBeEnabled()
    await expect(page.getByLabel('Category for First task')).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Delete First task', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled()
    await second.click()
    await expect(second).toBeChecked()
    await expect(second).toBeEnabled()
    await expect(first).toBeDisabled()
    await page.getByLabel('New Todo').fill('Draft during toggle')
    await expect(page.getByLabel('New Todo')).toHaveValue('Draft during toggle')
  } finally {
    releaseFirst()
  }
  await expect(first).toBeEnabled()
  await expect(first).toBeChecked()

  const releaseSecond = cloud.holdTodoToggle('Second task')
  cloud.failWrites = true
  try {
    await second.click()
    await expect(second).not.toBeChecked()
    await expect(second).toBeDisabled()
    await expect(first).toBeEnabled()
    await expect(page.getByLabel('New Todo')).toBeEnabled()
  } finally {
    releaseSecond()
  }
  await expect(page.getByRole('alert')).toHaveText('Simulated save failure')
  await expect(second).toBeChecked()
  await expect(second).toBeEnabled()
  await expect(first).toBeChecked()
  await expect(page.getByLabel('New Todo')).toHaveValue('Draft during toggle')
})
