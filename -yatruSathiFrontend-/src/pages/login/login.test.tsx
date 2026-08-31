import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

// Mock the axios instance the page posts through.
const post = vi.fn();
vi.mock('../../api/api', () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

import Login from './index';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
}

beforeEach(() => {
  post.mockReset();
  window.localStorage.clear();
});

describe('Login page', () => {
  it('renders the form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  });

  it('shows a validation error and does not call the API on empty submit', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByText(/enter both email and password/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('submits credentials and stores the returned token', async () => {
    post.mockResolvedValueOnce({
      data: { token: 'tok-123', user: { id: 1, email: 'a@gmail.com' } },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'a@gmail.com');
    await user.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(post).toHaveBeenCalledWith('auth/login/', {
      email: 'a@gmail.com',
      password: 'Passw0rd!',
    });
    expect(window.localStorage.getItem('token')).toBe('tok-123');
  });
});
