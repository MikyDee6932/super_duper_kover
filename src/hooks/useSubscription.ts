import { useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useUser } from './useUser';

export function useSubscription() {
  const { user } = useUser();
  const { isActive, customerInfo, isLoading, load, refresh } = useSubscriptionStore();

  useEffect(() => {
    if (user) load(user.id);
  }, [user?.id]);

  return { isActive, customerInfo, isLoading, refresh: () => user && refresh(user.id) };
}
