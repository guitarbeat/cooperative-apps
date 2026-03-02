import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import { logProduction } from '@/utils/productionLogger';
import type { Database } from './types';

type Listener = (state: ConnectionState) => void;

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'FETCH_ERROR',
]);

const CONNECTION_ERROR_MESSAGES = [
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'network error',
  'getaddrinfo',
  'request to http',
  'request to https',
  'aborted',
];

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const HEALTH_CHECK_INTERVAL_MS = 10_000;
const CONNECTION_CHECK_TIMEOUT_MS = 5_000;

const toError = (error: unknown, fallback: string): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message?: unknown }).message ?? fallback));
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return new Error(error);
  }

  return new Error(fallback);
};

export type ConnectionState = 'healthy' | 'degraded' | 'offline';

export interface ExecuteOptions {
  retryCount?: number;
  timeoutMs?: number;
  dedupeKey?: string;
}

export class SupabaseTimeoutError extends Error {
  constructor(message = 'Supabase request timed out.') {
    super(message);
    this.name = 'SupabaseTimeoutError';
  }
}

export class SupabaseOfflineError extends Error {
  constructor(message = 'Supabase backend is currently unreachable.') {
    super(message);
    this.name = 'SupabaseOfflineError';
  }
}

export const isSupabaseConnectionError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (error instanceof SupabaseOfflineError || error instanceof SupabaseTimeoutError) {
    return true;
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  if (code && CONNECTION_ERROR_CODES.has(code.toUpperCase())) {
    return true;
  }

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : '';

  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return CONNECTION_ERROR_MESSAGES.some((indicator) => normalized.includes(indicator));
};

export interface SupabaseConnectionConfig {
  url: string;
  key: string;
  options?: SupabaseClientOptions<'public'>;
}

export class SupabaseConnectionManager {
  private readonly client: SupabaseClient<Database>;
  private state: ConnectionState = 'healthy';
  private readonly listeners = new Set<Listener>();
  private healthCheckTimer?: number;
  private readonly pendingRequests = new Map<string, Promise<unknown>>();
  private lastError?: Error;

  constructor(private readonly config: SupabaseConnectionConfig) {
    this.client = createClient<Database>(config.url, config.key, config.options);

    if (typeof window !== 'undefined') {
      void this.checkConnection();
      this.startHealthMonitoring();
    }
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getLastError(): Error | undefined {
    return this.lastError;
  }

  public onStateChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async retryConnection(): Promise<boolean> {
    return this.checkConnection(true);
  }

  public async execute<T>(
    operation: (client: SupabaseClient<Database>) => PromiseLike<T>,
    options: ExecuteOptions = {},
  ): Promise<T> {
    const { retryCount = DEFAULT_RETRY_COUNT, timeoutMs = DEFAULT_TIMEOUT_MS, dedupeKey } = options;

    if (this.state === 'offline') {
      logProduction('warn', {
        action: 'supabase_circuit_breaker',
        status: 'blocked',
        message: 'Blocking request while connection is offline.',
      });
      throw new SupabaseOfflineError();
    }

    if (dedupeKey && this.pendingRequests.has(dedupeKey)) {
      return this.pendingRequests.get(dedupeKey)! as Promise<T>;
    }

    const runner = this.runWithRetry(operation, retryCount, timeoutMs);

    if (dedupeKey) {
      this.pendingRequests.set(dedupeKey, runner);
      runner.finally(() => {
        this.pendingRequests.delete(dedupeKey);
      });
    }

    return runner;
  }

  private async runWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => PromiseLike<T>,
    retryCount: number,
    timeoutMs: number,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < retryCount) {
      try {
        const result = await this.runWithTimeout(Promise.resolve(operation(this.client)), timeoutMs);
        if (this.state !== 'healthy') {
          this.updateState('healthy');
        }
        this.lastError = undefined;
        return result;
      } catch (error) {
        if (!isSupabaseConnectionError(error)) {
          throw error;
        }

        attempt += 1;
        this.handleConnectionFailure(error, attempt, retryCount);

        if (attempt >= retryCount) {
          throw error;
        }

        const backoffMs = Math.min(2 ** attempt * 200, 5_000);
        await this.wait(backoffMs);
      }
    }

    throw new SupabaseOfflineError('Supabase request failed after all retries.');
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    return new Promise<T>((resolve, reject) => {
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        reject(new SupabaseTimeoutError());
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async checkConnection(forceOffline = false): Promise<boolean> {
    if (typeof fetch === 'undefined') {
      return this.state === 'healthy';
    }

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
      const timeoutHandle = controller
        ? setTimeout(() => controller.abort(), CONNECTION_CHECK_TIMEOUT_MS)
        : undefined;

      const response = await fetch(`${this.config.url}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          apikey: this.config.key,
        },
        signal: controller?.signal,
      });

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      this.updateState('healthy');
      this.lastError = undefined;
      return true;
    } catch (error) {
      this.lastError = toError(error, 'Unable to connect to Supabase.');

      if (forceOffline) {
        this.updateState('offline');
      } else if (this.state === 'healthy') {
        this.updateState('degraded');
      }

      logProduction('warn', {
        action: 'supabase_health_check_failed',
        message: this.lastError.message,
        state: this.state,
      });

      return false;
    }
  }

  private startHealthMonitoring(): void {
    if (typeof window === 'undefined' || this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = window.setInterval(() => {
      if (this.state !== 'healthy') {
        void this.checkConnection(true);
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  private handleConnectionFailure(error: unknown, attempt: number, retryCount: number): void {
    this.lastError = toError(error, 'Supabase request failed.');

    const nextState: ConnectionState = attempt >= retryCount ? 'offline' : 'degraded';
    this.updateState(nextState);

    logProduction('warn', {
      action: 'supabase_request_retry',
      attempt,
      retryCount,
      state: nextState,
      message: this.lastError.message,
    });
  }

  private updateState(nextState: ConnectionState): void {
    if (this.state === nextState) {
      return;
    }

    this.state = nextState;
    this.listeners.forEach((listener) => {
      listener(nextState);
    });
  }

  private async wait(durationMs: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}

export const createSupabaseConnectionManager = (
  config: SupabaseConnectionConfig,
): SupabaseConnectionManager => new SupabaseConnectionManager(config);
