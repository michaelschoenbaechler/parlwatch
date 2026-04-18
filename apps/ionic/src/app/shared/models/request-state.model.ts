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

/**
 * Creates a new RequestState with default values.
 * - loading: false
 * - success: false
 * - error: null
 * @template T Type of the request payload
 * @param initialData Optional initial data to attach
 * @returns Fresh request state instance
 */
export function createDefaultRequestState<T>(initialData?: T): RequestState<T> {
  return {
    loading: false,
    success: false,
    error: null,
    data: initialData
  };
}

/**
 * Marks the request as loading and clears previous success/error flags.
 * Optionally primes the state with new data (useful for optimistic UI updates).
 * Note: data is only set when a truthy value is provided.
 * @template T
 * @param req Previous request state
 * @param data Optional data to set while loading
 * @returns Updated request state in loading state
 */
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

/**
 * Marks the request as successfully completed with the given payload.
 * Clears error and stops loading.
 * @template T
 * @param req Previous request state
 * @param data Resulting data for the request
 * @returns Updated request state in success state
 */
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

/**
 * Marks the request as failed with the provided error information.
 * Clears success and stops loading. Falls back to a default error when none is provided.
 * @template T
 * @param req Previous request state
 * @param errorInfo Structured error details
 * @returns Updated request state in error state
 */
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
