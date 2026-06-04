import { useAuthStore } from '../store/authStore';

export function useUser() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();
  return { user, profile, isLoading, isInitialized };
}
