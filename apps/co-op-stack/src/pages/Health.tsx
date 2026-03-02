import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, Database, Wifi, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getVersionInfo } from '@/utils/version';

interface HealthCheck {
  name: string;
  status: 'pending' | 'ok' | 'error';
  message?: string;
  latency?: number;
}

export default function Health() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'App', status: 'pending' },
    { name: 'Supabase Auth', status: 'pending' },
    { name: 'Supabase Database', status: 'pending' },
    { name: 'Supabase Realtime', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const results: HealthCheck[] = [];

    // App check (always passes if we got here)
    results.push({ name: 'App', status: 'ok', message: 'React app loaded' });

    // Supabase Auth check
    const authStart = performance.now();
    try {
      const { error } = await supabase.auth.getSession();
      const latency = Math.round(performance.now() - authStart);
      results.push({
        name: 'Supabase Auth',
        status: error ? 'error' : 'ok',
        message: error ? error.message : 'Auth service reachable',
        latency,
      });
    } catch (e) {
      results.push({
        name: 'Supabase Auth',
        status: 'error',
        message: e instanceof Error ? e.message : 'Connection failed',
      });
    }

    // Supabase Database check
    const dbStart = performance.now();
    try {
      const { error } = await supabase.from('meetings').select('id').limit(1);
      const latency = Math.round(performance.now() - dbStart);
      results.push({
        name: 'Supabase Database',
        status: error ? 'error' : 'ok',
        message: error ? error.message : 'Database query succeeded',
        latency,
      });
    } catch (e) {
      results.push({
        name: 'Supabase Database',
        status: 'error',
        message: e instanceof Error ? e.message : 'Query failed',
      });
    }

    // Supabase Realtime check
    const rtStart = performance.now();
    try {
      const channel = supabase.channel('health-check');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          if (status === 'SUBSCRIBED') {
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Channel error'));
          }
        });
      });
      const latency = Math.round(performance.now() - rtStart);
      await supabase.removeChannel(channel);
      results.push({
        name: 'Supabase Realtime',
        status: 'ok',
        message: 'Realtime connected',
        latency,
      });
    } catch (e) {
      results.push({
        name: 'Supabase Realtime',
        status: 'error',
        message: e instanceof Error ? e.message : 'Realtime failed',
      });
    }

    setChecks(results);
    setIsRunning(false);
  };

  useEffect(() => {
    void runHealthChecks();
  }, []);

  const versionInfo = getVersionInfo();
  const allOk = checks.every((c) => c.status === 'ok');
  const hasError = checks.some((c) => c.status === 'error');

  const getIcon = (name: string) => {
    switch (name) {
      case 'App':
        return <Server className="h-4 w-4" />;
      case 'Supabase Auth':
        return <Wifi className="h-4 w-4" />;
      case 'Supabase Database':
        return <Database className="h-4 w-4" />;
      case 'Supabase Realtime':
        return <Wifi className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-[80vh] bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Quick diagnostics for app and backend services
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Status
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : allOk ? (
                <Badge variant="default" className="bg-success text-success-foreground">All Systems OK</Badge>
              ) : hasError ? (
                <Badge variant="destructive">Issues Detected</Badge>
              ) : null}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void runHealthChecks()}
              disabled={isRunning}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{getIcon(check.name)}</span>
                  <div>
                    <p className="font-medium">{check.name}</p>
                    {check.message && (
                      <p className="text-xs text-muted-foreground">{check.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {check.latency !== undefined && (
                    <span className="text-xs text-muted-foreground">{check.latency}ms</span>
                  )}
                  {check.status === 'pending' && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {check.status === 'ok' && (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                  {check.status === 'error' && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Build Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Version</div>
              <div className="font-mono">{versionInfo.version}</div>
              <div className="text-muted-foreground">Commit</div>
              <div className="font-mono">{versionInfo.gitCommit}</div>
              <div className="text-muted-foreground">Branch</div>
              <div className="font-mono">{versionInfo.gitBranch}</div>
              <div className="text-muted-foreground">Environment</div>
              <div className="font-mono">{versionInfo.environment}</div>
              <div className="text-muted-foreground">Built</div>
              <div className="font-mono">
                {new Date(versionInfo.buildTime).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
