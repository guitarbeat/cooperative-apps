import { WifiOff, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseConnection } from '@/integrations/supabase/connection-context';

const ConnectionStatusBanner = () => {
  const { state, lastError, retry, isChecking } = useSupabaseConnection();

  if (state === 'healthy') {
    return null;
  }

  const isOffline = state === 'offline';
  const Icon = isOffline ? WifiOff : Activity;
  const message = isOffline
    ? 'We are unable to reach the meeting service. Some actions may be unavailable.'
    : 'The connection to the meeting service is unstable. Retrying automatically...';

  return (
    <div
      role="status"
      className={`flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between ${
        isOffline ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{isOffline ? 'Offline mode' : 'Connection degraded'}</p>
          <p className="opacity-90">
            {message}
            {lastError?.message ? ` (${lastError.message})` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void retry();
          }}
          disabled={isChecking}
        >
          {isChecking ? 'Checking…' : 'Retry now'}
        </Button>
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;
