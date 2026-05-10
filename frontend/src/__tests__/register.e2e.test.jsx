import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'
import { store } from '../store/store'

describe('Register page', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders core form fields', () => {
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument()
    expect(container.querySelector('select[name="role"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument()
  })
})
