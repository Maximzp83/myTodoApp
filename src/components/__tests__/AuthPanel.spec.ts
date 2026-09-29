import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AuthPanel from '@/components/AuthPanel.vue'

describe('AuthPanel', () => {
  it('offers sign-in and registration and emits credentials', async () => {
    const wrapper = mount(AuthPanel, {
      props: { busy: false, configured: true, error: '', notice: '' },
    })
    await wrapper.get('#account-email').setValue('a@example.com')
    await wrapper.get('#account-password').setValue('password123')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['sign-in', 'a@example.com', 'password123']])
    const register = wrapper.findAll('button').find((button) => button.text() === 'Register')
    if (!register) throw new Error('Registration control is missing')
    await register.trigger('click')
    expect(wrapper.get<HTMLInputElement>('#account-password').element.value).toBe('')
    expect(wrapper.get('#account-password').attributes('minlength')).toBe('8')
  })

  it('disables account fields while requests are pending', () => {
    const wrapper = mount(AuthPanel, {
      props: { busy: true, configured: true, error: '', notice: '' },
    })
    expect(wrapper.get<HTMLFieldSetElement>('fieldset').element.disabled).toBe(true)
  })
})
