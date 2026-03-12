/**
 * FEVO JWT Token Manager
 *
 * Handles authentication lifecycle for the FEVO staging API.
 * Logs in via POST /api/account/login and caches the JWT token,
 * re-authenticating automatically when the token expires.
 */

interface TokenState {
  accessToken: string;
  expiresAt: number; // epoch ms
}

export interface IFevoTokenManager {
  getAccessToken(): Promise<string>;
  invalidate(): void;
}

export class FevoTokenManager implements IFevoTokenManager {
  private baseUrl: string;
  private username: string;
  private password: string;
  private tokenState: TokenState | null = null;
  private loginPromise: Promise<string> | null = null;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.tokenState && Date.now() < this.tokenState.expiresAt - 60_000) {
      return this.tokenState.accessToken;
    }

    // Prevent concurrent login attempts
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = this.login();
    try {
      const token = await this.loginPromise;
      return token;
    } finally {
      this.loginPromise = null;
    }
  }

  invalidate(): void {
    this.tokenState = null;
  }

  private async login(): Promise<string> {
    const url = `${this.baseUrl}/api/account/login`;
    const body = new URLSearchParams({
      Username: this.username,
      Password: this.password,
      Grant_Type: 'password',
    });

    console.log(`[FevoTokenManager] Logging in to ${this.baseUrl}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`FEVO login failed: ${response.status} ${response.statusText} — ${text}`);
    }

    const data: any = await response.json();
    const accessToken: string = data.access_token;
    const expiresIn: number = data.expires_in || 3600; // seconds

    if (!accessToken) {
      throw new Error('FEVO login response missing access_token');
    }

    this.tokenState = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    console.log(`[FevoTokenManager] Login successful, token expires in ${expiresIn}s`);
    return accessToken;
  }
}

// ── Singleton factory ─────────────────────────────────────────────────────────

let instance: IFevoTokenManager | null = null;

export function getFevoTokenManager(): IFevoTokenManager | null {
  if (instance) return instance;

  const baseUrl = process.env.FEVO_API_BASE_URL;
  const username = process.env.FEVO_USERNAME;
  const password = process.env.FEVO_PASSWORD;

  if (baseUrl && username && password) {
    instance = new FevoTokenManager(baseUrl, username, password);
    return instance;
  }

  return null;
}

export function resetFevoTokenManager(): void {
  instance = null;
}
