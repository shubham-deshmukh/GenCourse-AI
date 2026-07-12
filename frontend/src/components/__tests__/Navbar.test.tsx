import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import { useAuthStore } from '../../store/useAuthStore';
import '@testing-library/jest-dom';

// Enable jsdom environment for this component test file
// @vitest-environment jsdom

describe('Navbar Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset Zustand store state before each test run
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    // Mock window.location to capture redirect hrefs
    delete (window as any).location;
    (window as any).location = {
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    } as any;

    // Mock localStorage
    (globalThis as any).localStorage = {
      removeItem: vi.fn(),
      setItem: vi.fn(),
      getItem: vi.fn(),
    };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  test('should render GenCourseAI logo and branding', () => {
    render(<Navbar />);
    expect(screen.getByText(/GenCourse/i)).toBeInTheDocument();
    expect(screen.getByText(/AI/i)).toBeInTheDocument();
  });

  test('should render Sign In and Get Started Free buttons when unauthenticated', () => {
    render(<Navbar />);
    // Check desktop buttons
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Started Free').length).toBeGreaterThan(0);
  });

  test('should render loading skeleton when isLoading is true', () => {
    useAuthStore.setState({ isLoading: true });
    const { container } = render(<Navbar />);
    // Check for anim pulse skeleton wrapper
    const pulseDiv = container.querySelector('.animate-pulse');
    expect(pulseDiv).toBeInTheDocument();
  });

  test('should render user avatar, name, and logout button when authenticated', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      picture: 'john_pic.png'
    };

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false
    });

    render(<Navbar />);

    // Assert user avatar details
    const avatarImg = screen.getByAltText('John Doe');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'john_pic.png');
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Dropdown is initially closed. Click avatar button to toggle open.
    const avatarBtn = screen.getByRole('button', { name: /John Doe/i });
    fireEvent.click(avatarBtn);

    // Dropdown list displays email address and Sign Out button
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    const signOutBtn = screen.getByText('Sign Out');
    expect(signOutBtn).toBeInTheDocument();

    // Click Sign Out action
    fireEvent.click(signOutBtn);
    expect(localStorage.removeItem).toHaveBeenCalledWith('gencourse_token');
    expect(window.location.href).toContain('/auth/logout');
  });

  test('should redirect to login on Sign In click', () => {
    render(<Navbar />);
    const signInBtn = screen.getAllByText('Sign In')[0]; // Desktop button
    fireEvent.click(signInBtn);
    expect(window.location.href).toContain('/auth/login');
  });
});
