/**
 * Safe JSON fetch utility that prevents SyntaxError when the server returns
 * HTML (e.g., during proxy reboot, 404, or 502/503 errors).
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          data,
          error: data.error || (data.message ? data.message : `Server responded with status ${res.status}`),
          status: res.status
        };
      }
      return { ok: true, data, status: res.status };
    }

    // Response is not JSON (HTML error page, proxy gateway message, etc.)
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: 'Endpoint or link not found (404)', status: 404 };
      }
      if (res.status >= 500) {
        return { ok: false, error: 'Server is temporarily restarting or updating. Please try again.', status: res.status };
      }
      return { ok: false, error: text.slice(0, 100) || `Request failed (${res.status})`, status: res.status };
    }

    return { ok: false, error: 'Unexpected non-JSON response from server', status: res.status };
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      return { ok: false, error: 'Cannot connect to server. Please try again in a few seconds.', status: 0 };
    }
    return { ok: false, error: msg || 'Network request failed', status: 0 };
  }
}
