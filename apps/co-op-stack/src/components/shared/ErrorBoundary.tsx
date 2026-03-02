import { Component, ErrorInfo, ReactNode, type ContextType } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getErrorDisplayInfo, logError } from '../../utils/errorHandling';
import { logProduction } from '@/utils/productionLogger';
import { SupabaseConnectionContext } from '@/integrations/supabase/connection-context';
import {
  isSupabaseConnectionError,
  SupabaseOfflineError,
  SupabaseTimeoutError,
} from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public static override contextType = SupabaseConnectionContext;
  public override state: State = {
    hasError: false
  };

  declare context: ContextType<typeof SupabaseConnectionContext>;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logProduction('error', {
      action: 'error_boundary',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    logError(error, 'ErrorBoundary');
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      const error = this.state.error ?? new Error('Unknown error');
      const connectionContext = this.context;
      const isSupabaseError =
        isSupabaseConnectionError(error) ||
        error instanceof SupabaseOfflineError ||
        error instanceof SupabaseTimeoutError;

const ErrorHeader = ({ title }: { title: string }) => (
  <CardHeader className="text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-6 w-6 text-destructive" />
    </div>
    <CardTitle className="text-xl">{title}</CardTitle>
  </CardHeader>
);

      if (isSupabaseError && connectionContext) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <ErrorHeader title="Connection issue" />
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  We lost contact with the meeting service. We are retrying automatically.
                </p>
                {connectionContext.lastError && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    Technical details: {connectionContext.lastError.message}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      void connectionContext.retry();
                    }}
                    disabled={connectionContext.isChecking}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {connectionContext.isChecking ? 'Reconnecting…' : 'Retry connection'}
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline">
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      const errorInfo = getErrorDisplayInfo(error);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <ErrorHeader title={errorInfo.title} />
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                {errorInfo.description}
              </p>
              {errorInfo.action && (
                <p className="text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  💡 {errorInfo.action}
                </p>
              )}
              {this.state.error && (
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer">Technical details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\nStack trace:\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;