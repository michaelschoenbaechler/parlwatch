export interface ErrorInfoDetails {
  /**
   * Internal error message used for tracking. Must not contain sensitive information.
   */
  message: string;
  /**
   * The HTTP status code of the error response, only applicable if the error is related to a network request.
   * A value of 0 indicates a network (connection) error.
   * A value of -1 indicates that the error processor was unable to read the response status.
   */
  statusCode?: number;
}

export interface ErrorInfo {
  /**
   * Information about the cause of the error.
   */
  details: ErrorInfoDetails;
}

export const defaultErrorInfo: ErrorInfo = {
  details: {
    message: 'unknown error'
  }
};
