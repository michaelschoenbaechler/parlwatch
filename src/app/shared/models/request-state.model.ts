import { defaultErrorInfo, ErrorInfo } from './error-info.model';

/**
 * API request entity
 * @param loading is request in loading state
 * @param success request did successfully load
 * @param error error message (language key)
 * @param data resulting data of generic type
 */
export interface RequestState<T = unknown> {
  loading: boolean;
  success: boolean;
  error: ErrorInfo | null;
  data?: T;
}

export function createDefaultRequestState<T>(initialData?: T): RequestState<T> {
  return {
    loading: false,
    success: false,
    error: null,
    data: initialData
  };
}

export function onRequestLoad<T>(
  req: RequestState<T>,
  data?: T
): RequestState<T> {
  return {
    ...req,
    loading: true,
    success: false,
    error: null,
    ...(data && { data })
  };
}

export function onRequestSuccess<T>(
  req: RequestState<T>,
  data?: T
): RequestState<T> {
  return {
    ...req,
    loading: false,
    success: true,
    error: null,
    data
  };
}

export function onRequestError<T>(
  req: RequestState<T>,
  errorInfo?: ErrorInfo
): RequestState<T> {
  return {
    ...req,
    loading: false,
    success: false,
    error: errorInfo ?? defaultErrorInfo
  };
}
