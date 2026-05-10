import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { store } from '../store/store'

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders login form fields', () => {
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument()
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument()
  })
})
