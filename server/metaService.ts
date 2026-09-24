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
    // 1. Query universal fields compatible with Campaign, Ad Set, and Ad
    // Note: Do NOT include 'creative' here as it causes "Unsupported get request" on Campaign & AdSet objects!
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(cleanAdId)}?fields=id,name,status,effective_status&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      let errMsg = data.error?.message || `Meta Graph API responded with status ${response.status}`;

      // If it's the common "Object does not exist or missing permissions" error, check token permissions to help the user
      if (data.error?.code === 100 || errMsg.includes('missing permissions') || errMsg.includes('does not exist')) {
        try {
          const permRes = await fetch(
            `https://graph.facebook.com/v20.0/me/permissions?access_token=${encodeURIComponent(token)}`
          );
          const permData = await permRes.json();
          if (permData.data && Array.isArray(permData.data)) {
            const granted: string[] = permData.data
              .filter((p: any) => p.status === 'granted')
              .map((p: any) => p.permission);

            const hasAdsRead = granted.includes('ads_read') || granted.includes('ads_management');
            if (!hasAdsRead) {
              errMsg = `[Missing Permission] Ang iyong token ay walang "ads_read" o "ads_management" permission (Permissions found: ${granted.length ? granted.join(', ') : 'none'}). Pumunta sa Meta Business Suite > System Users > Generate Token at i-check ang "ads_read".`;
            } else {
              errMsg = `[Asset Assignment Needed] Ang token ay may "ads_read", ngunit ang System User o App ay hindi pa naka-assign sa Ad Account na may ID "${cleanAdId}". Sa Meta Business Suite: Pumunta sa Users > System Users > [Piliin ang User] > Pindutin ang "Assign Assets" > Piliin ang inyong Ad Account at i-enable ang "View performance / Manage campaigns".`;
            }
          } else if (permData.error?.message) {
            errMsg = `[Token Error] Hindi mabasa ang token: ${permData.error.message}`;
          }
        } catch {
          // Keep original error if permission check fails
        }
      }

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
