// src/App.test.js
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

beforeEach(() => {
  // This runs before each test
  localStorage.setItem('token', 'mock-token')
})

afterEach(() => {
  // Clean up after each test
  localStorage.clear()
})

test('renders SignIn page on "/" route without token', () => {
  // We clear token here to simulate no login
  localStorage.clear()

  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText(/sign in to job tracker/i)).toBeInTheDocument()
})

test('renders AddApplication page on /addapplication route with token', () => {
  // beforeEach already sets token, so no need to set again here

  render(
    <MemoryRouter initialEntries={['/addapplication']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText(/add a job application/i)).toBeInTheDocument()
})
