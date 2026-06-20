/** Uniform envelope returned by every API endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
