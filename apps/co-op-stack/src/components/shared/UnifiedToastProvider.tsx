import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

interface UnifiedToastProviderProps {
  children: ReactNode;
}

export function UnifiedToastProvider({ children }: UnifiedToastProviderProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

export default UnifiedToastProvider;