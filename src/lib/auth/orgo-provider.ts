import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';

const ORGO_ISSUER = process.env['ORGO_ISSUER'] ?? 'https://eaep.escoteiros.pt';

/**
 * Orgo userinfo payload for the requested OAuth scopes.
 * @see https://orgo.space/docs/api-reference/recipes/integrate-oauth-login
 */
export interface OrgoProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  groups?: string[];
  roles?: string[];
  tenant_id?: string;
}

/**
 * Auth.js OAuth provider for tenant-hosted Orgo (authorization code + PKCE).
 * Endpoints are explicit because this tenant's well-known URL is served by the SPA.
 */
export function OrgoProvider(
  options: OAuthUserConfig<OrgoProfile>
): OAuthConfig<OrgoProfile> {
  return {
    id: 'orgo',
    name: 'eAEP',
    type: 'oauth',
    issuer: ORGO_ISSUER,
    authorization: {
      url: `${ORGO_ISSUER}/authorize`,
      params: { scope: 'profile email' },
    },
    token: `${ORGO_ISSUER}/api/v1/oauth/token`,
    userinfo: `${ORGO_ISSUER}/api/v1/oauth/userinfo`,
    // PKCE is mandatory on Orgo. Do not send Auth.js's encrypted `state`:
    // it is a long JWE and Orgo echoes it back changed/truncated, which
    // fails oauth4webapi with "unexpected state response parameter value".
    checks: ['pkce'],
    client: {
      token_endpoint_auth_method: 'client_secret_basic',
    },
    profile(profile) {
      const name =
        profile.name ??
        [profile.given_name, profile.family_name].filter(Boolean).join(' ') ??
        undefined;

      return {
        id: String(profile.sub),
        name: name || undefined,
        email: profile.email,
        image: profile.picture,
      };
    },
    style: {
      brandColor: '#1B3A6B',
    },
    ...options,
  };
}
