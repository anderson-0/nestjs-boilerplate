export interface IErrorTrackingService {
  isReady(): boolean;
  captureException(error: Error, metadata?: Record<string, any>): void;
  captureMessage?(message: string, level?: string, metadata?: Record<string, any>): void;
  setUser(userId: string, email?: string, name?: string): void;
  addBreadcrumb?(message: string, category?: string, data?: Record<string, any>): void;
  flush?(): Promise<void | boolean>;
}

export interface ErrorMetadata {
  request?: {
    method: string;
    url: string;
    query?: any;
    params?: any;
    body?: any;
    headers?: any;
    ip?: string;
    userAgent?: string;
  };
  response?: {
    statusCode: number;
    message: string;
  };
  user?: {
    id: string;
    email?: string;
  };
  timestamp: string;
}