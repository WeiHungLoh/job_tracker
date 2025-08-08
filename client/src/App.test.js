import { render, screen, waitFor } from '@testing-library/react'
import App from './App.js'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

// Mocks fetch function so that we can simulate successful/unsuccessful fetching of data from backend
global.fetch = jest.fn()

describe('App routing and authentication behavior', () => {
  beforeEach(() => {
    // Resets so that returnResolvedValue will be cleared for every mock fetch request
    fetch.mockReset()
  })

  test('displays SignIn page when visiting root path "/"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument()
  })

  test('redirects to SignIn when accessing protected route while unauthenticated', async () => {
    // Mocks unsuccessful auth check in .../auth/check route
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    // Simulates scenario where user tries to head to /addapplication without a cookie
    render(
      <MemoryRouter initialEntries={['/addapplication']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument()
    })

    // Simulates the activation of ProtectedRoute when navigating to /addapplication
    expect(fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/authentication/token-verification`, { credentials: 'include' }
    )
  })

  test('renders AddApplication page when user is authenticated', async () => {
    // Mock successful auth check in .../auth/check route
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/addapplication']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/add a job application/i)).toBeInTheDocument()
    })

    // Simulates the activation of ProtectedRoute when navigating to /addapplication
    expect(fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/authentication/token-verification`, { credentials: 'include' }
    )
  })

  test('renders navigation bar on authenticated routes', async () => {
    // Mock successful auth check in .../auth/check route
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/viewapplications']}>
        <App />
      </MemoryRouter>
    )

    // Checks whether navigation bar is rendered when user is authenticated
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  test('renders navigation bar on authenticated routes', async () => {
    // Mock successful auth check in .../auth/check route
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/viewarchivedapplications']}>
        <App />
      </MemoryRouter>
    )

    // Checks whether navigation bar is rendered when user is authenticated
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  test('renders navigation bar on authenticated routes', async () => {
    // Mock successful auth check in .../auth/check route
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/viewarchivedinterviews']}>
        <App />
      </MemoryRouter>
    )

    // Checks whether navigation bar is rendered when user is authenticated
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  test('hides navigation bar on public routes like "/signup"', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    )

    // Ensures that navigation bar is not present in sign up page
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  test('displays page 404 not found on unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/addassignment']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText(/checking authentication status/i)).toBeInTheDocument()

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/addassignment']}>
        <App />
      </MemoryRouter>
    )

    waitFor(() => expect(screen.getByText(/Page 404 not found/i)).toBeInTheDocument(), 1000)
  })

  test('displays active navigation bar when on dashboard page', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  test('displays sign in page after clicking logout', () => {
    render(
      <MemoryRouter initialEntries={['/viewinterviews']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    userEvent.click(screen.getByText(/logout/i))
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    })

    render(
      <MemoryRouter initialEntries={['/viewinterviews']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/Sign in to job tracker/i)).toBeInTheDocument()
  })
})

