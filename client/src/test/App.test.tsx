import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import { appRoutes } from '../App'
import { render } from './renderWithToast'
import userEvent from '@testing-library/user-event'

globalThis.fetch = vi.fn()

class RouterRequest {
  headers: Headers
  method: string
  signal: AbortSignal | undefined
  url: string

  constructor(input: string, init: RequestInit = {}) {
    this.headers = new Headers(init.headers)
    this.method = init.method ?? 'GET'
    this.signal = init.signal ?? undefined
    this.url = input
  }
}

vi.stubGlobal('Request', RouterRequest)

const response = (ok = true, status = 200, data?: string, contentType?: string) => ({
  headers: new Headers(contentType ? { 'content-type': contentType } : undefined),
  ok,
  status,
  statusText: '',
  text: async () => data ?? '',
  url: '',
})

const renderRoute = (path: string) => {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('App routing and authentication behavior', () => {
  beforeEach(() => {
    fetch.mockReset()
    fetch.mockResolvedValue(response())
  })

  test('redirects the root path to SignIn', async () => {
    renderRoute('/')
    expect(await screen.findByText(/sign in to job tracker/i)).toBeInTheDocument()
  })

  test('redirects to SignIn when accessing protected route while unauthenticated', async () => {
    fetch.mockResolvedValueOnce(response(false, 401))
    renderRoute('/application/add')

    await waitFor(() => expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/authentication/sessions/current`,
      { credentials: 'include', method: 'GET' },
    )
  })

  test('redirects to SignIn when authentication receives the Vite HTML fallback', async () => {
    fetch.mockResolvedValueOnce(response(true, 200, '<!doctype html><html></html>', 'text/html'))
    renderRoute('/application/view')

    await waitFor(() => expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument())
    expect(screen.queryByText(/unexpected application error/i)).not.toBeInTheDocument()
  })

  test('shows a retry state when authentication is temporarily unavailable', async () => {
    fetch.mockResolvedValueOnce({
      ...response(false, 503),
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Authentication is temporarily unavailable.' }),
    })
    renderRoute('/application/view')

    await waitFor(() => expect(screen.getByText(
      /Unable to verify authentication. Please try again./i,
    )).toBeInTheDocument())
    expect(screen.queryByText(/sign in to job tracker/i)).not.toBeInTheDocument()
    expect(screen.getByText('Authentication is temporarily unavailable.')).toBeInTheDocument()
  })

  test('renders AddApplication page when user is authenticated', async () => {
    renderRoute('/application/add')

    await waitFor(() => expect(screen.getByText(/add a job application/i)).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/authentication/sessions/current`,
      { credentials: 'include', method: 'GET' },
    )
  })

  test.each(['/application/view', '/application/archive', '/interview/archive'])(
    'renders navigation bar on authenticated route %s',
    async route => {
      renderRoute(route)
      await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument())
    },
  )

  test('hides navigation bar on public routes like "/authentication/sign-up"', () => {
    renderRoute('/authentication/sign-up')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  test('displays page 404 not found on unknown routes after authentication', async () => {
    renderRoute('/addassignment')
    await waitFor(() => expect(screen.getByText(/Page 404 not found/i)).toBeInTheDocument())
  })

  test('displays active navigation bar when on dashboard page', async () => {
    renderRoute('/dashboard')
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument())
  })

  test('displays sign in page after clicking logout', async () => {
    renderRoute('/interview/view')
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument())
    await userEvent.click(screen.getByText(/logout/i))
    await waitFor(() => expect(screen.getByText(/Sign in to job tracker/i)).toBeInTheDocument())
  })
})
