import { describe, test, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test run to original defaults
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true
    });
  });

  test('should initialize with correct default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  test('setAuthState should update the authentication state', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', picture: 'pic_url', sub: 'sub_123' };
    useAuthStore.getState().setAuthState(mockUser, true, false);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  test('logoutState should clean up the authentication state', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com' };
    useAuthStore.getState().setAuthState(mockUser, true, false);
    useAuthStore.getState().logoutState();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
