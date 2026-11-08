import { createHmac } from "node:crypto";

export class ProviderError extends Error {
  constructor(kind = "provider_unavailable") {
    super(kind);
    this.kind = kind;
  }
}

export function createMeta(config, fetcher = fetch, now = Date.now) {
  const root = `https://graph.facebook.com/${config.apiVersion}/`;
  async function request(url, options = {}) {
    try {
      const response = await fetcher(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      });
      const body = await response.json();
      if (!response.ok || body.error) {
        throw new ProviderError(
          body.error?.code === 190
            ? "reconnect_required"
            : "provider_unavailable",
        );
      }
      return body;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      // Never propagate URLs, authorization codes, access tokens, or Meta's raw response.
      throw new ProviderError();
    }
  }
  function proof(token) {
    return createHmac("sha256", config.appSecret).update(token).digest("hex");
  }
  async function graph(path, token, params = {}) {
    const url = new URL(path, root);
    if (url.origin !== "https://graph.facebook.com") throw new ProviderError();
    url.search = new URLSearchParams({
      ...params,
      appsecret_proof: proof(token),
    });
    return request(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  async function exchange(code) {
    // Meta's documented server-side code exchange uses this endpoint. Never log its URL.
    const url = new URL("oauth/access_token", root);
    url.search = new URLSearchParams({
      client_id: config.appId,
      client_secret: config.appSecret,
      redirect_uri: config.callbackUrl,
      code,
    });
    const data = await request(url);
    if (typeof data.access_token !== "string" || !data.access_token)
      throw new ProviderError();
    return {
      token: data.access_token,
      expiresAt:
        Number(data.expires_in) > 0
          ? now() + Number(data.expires_in) * 1000
          : null,
    };
  }
  async function accounts(token) {
    const found = new Map();
    // Unified Login supplies a system-user token. /me itself is NOT the Instagram profile.
    let after;
    for (let page = 0; page < 20; page++) {
      const data = await graph("me/assigned_instagram_accounts", token, {
        fields: "id,username,name",
        limit: "100",
        ...(after ? { after } : {}),
      });
      if (!Array.isArray(data.data)) throw new ProviderError();
      for (const account of data.data) {
        if (
          /^\d+$/.test(String(account.id)) &&
          typeof account.username === "string"
        ) {
          found.set(String(account.id), {
            id: String(account.id),
            username: account.username,
            name: typeof account.name === "string" ? account.name : "",
          });
        }
      }
      const next = data.paging?.cursors?.after;
      if (!data.paging?.next || !next || next === after) break;
      after = next;
    }
    return [...found.values()];
  }
  function authorize(state) {
    const url = new URL(
      `https://www.facebook.com/${config.apiVersion}/dialog/oauth`,
    );
    url.search = new URLSearchParams({
      client_id: config.appId,
      config_id: config.configId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      override_default_response_type: "true",
      prompt: "login",
      display: "page",
      state,
    });
    // Permissions come from the selected Unified Login configuration, not a second scope list.
    return url.toString();
  }
  async function revoke(token) {
    const url = new URL("me/permissions", root);
    url.searchParams.set("appsecret_proof", proof(token));
    await request(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return { authorize, exchange, accounts, revoke };
}
