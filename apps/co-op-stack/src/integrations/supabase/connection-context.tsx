import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getSupabaseConnectionError,
  getSupabaseConnectionState,
  onSupabaseConnectionStateChange,
  retrySupabaseConnection,
  type ConnectionState,
} from './client';

type SupabaseConnectionContextValue = {
  state: ConnectionState;
  lastError?: Error;
  isChecking: boolean;
  retry: () => Promise<boolean>;
};

const SupabaseConnectionContext = createContext<SupabaseConnectionContextValue | undefined>(undefined);

export const SupabaseConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ConnectionState>(getSupabaseConnectionState());
  const [lastError, setLastError] = useState<Error | undefined>(getSupabaseConnectionError());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = onSupabaseConnectionStateChange((nextState) => {
      setState(nextState);
      setLastError(getSupabaseConnectionError());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const retry = async () => {
    setIsChecking(true);
    try {
      const result = await retrySupabaseConnection();
      setState(getSupabaseConnectionState());
      setLastError(getSupabaseConnectionError());
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  const value = useMemo(
    () => ({
      state,
      lastError,
      retry,
      isChecking,
    }),
    [isChecking, lastError, state],
  );

  return (
    <SupabaseConnectionContext.Provider value={value}>
      {children}
    </SupabaseConnectionContext.Provider>
  );
};

export const useSupabaseConnection = (): SupabaseConnectionContextValue => {
  const context = useContext(SupabaseConnectionContext);

  if (!context) {
    throw new Error('useSupabaseConnection must be used within a SupabaseConnectionProvider');
  }

  return context;
};

export { SupabaseConnectionContext };
