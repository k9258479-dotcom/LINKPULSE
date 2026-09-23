import type { MetaEffectiveStatus } from '../src/types.js';

export interface MetaAdStatusResult {
  success: boolean;
  adId: string;
  effectiveStatus?: MetaEffectiveStatus;
  statusName?: string;
  name?: string;
  configuredStatus?: string;
  creativeId?: string;
  error?: string;
  raw?: any;
  checkedAt: string;
}

/**
 * Checks the status of a Meta Ad via Meta Graph API v20.0
 * Endpoint: https://graph.facebook.com/v20.0/{ad-id}?fields=effective_status,name,status,creative&access_token={token}
 */
export async function checkMetaAdStatus(
  adId: string,
  accessToken?: string
): Promise<MetaAdStatusResult> {
  const token = (accessToken || process.env.META_ACCESS_TOKEN || '').trim();
  const cleanAdId = (adId || '').trim().replace(/^act_/, '');
  const checkedAt = new Date().toISOString();

  if (!cleanAdId) {
    return {
      success: false,
      adId: '',
      error: 'Ad ID is required',
      checkedAt
    };
  }

  // If token is not provided or set, simulate or return descriptive error
  if (!token || token === 'MY_META_ACCESS_TOKEN' || token === 'EAAxxxxxxx') {
    return {
      success: false,
      adId: cleanAdId,
      error: 'No valid Meta System User Access Token provided. Please add META_ACCESS_TOKEN in settings or .env',
      checkedAt
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(cleanAdId)}?fields=id,name,status,effective_status,creative&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `Meta Graph API responded with status ${response.status}`;
      return {
        success: false,
        adId: cleanAdId,
        error: errMsg,
        raw: data,
        checkedAt
      };
    }

    const effectiveStatus: MetaEffectiveStatus = data.effective_status || 'UNKNOWN';

    return {
      success: true,
      adId: cleanAdId,
      effectiveStatus,
      statusName: data.status,
      name: data.name,
      configuredStatus: data.status,
      creativeId: data.creative?.id,
      raw: data,
      checkedAt
    };
  } catch (err: any) {
    return {
      success: false,
      adId: cleanAdId,
      error: err.message || 'Network error communicating with Meta Graph API',
      checkedAt
    };
  }
}

/**
 * Detects if the User-Agent represents a Meta Crawler / Review Bot
 * Meta bots include:
 * - facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)
 * - facebookexternalhit/1.0
 * - Facebot
 * - FacebookBot
 * - Meta-ExternalAgent
 * - Meta-ExternalFetcher
 */
export function isMetaCrawlerUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return (
    lower.includes('facebookexternalhit') ||
    lower.includes('facebot') ||
    lower.includes('facebookbot') ||
    lower.includes('meta-externalagent') ||
    lower.includes('meta-externalfetcher')
  );
}
