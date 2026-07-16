/**
 * Wrapper around fetch that automatically includes credentials for API calls
 * This ensures session cookies are sent with all requests, enabling authentication
 */
export async function fetchWithAuth(
  url: string | Request,
  options?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
}
