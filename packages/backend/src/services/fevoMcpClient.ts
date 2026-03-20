/**
 * FEVO MCP Client
 *
 * Calls FEVO MCP server tools via JSON-RPC over HTTP.
 * Uses Node.js native https module for reliable SSE stream handling.
 */

import * as https from 'https';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class FevoMcpClient {
  private mcpUrl: string;
  private parsedHost: string;
  private parsedPath: string;
  private sessionId: string | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private nextId = 1;

  constructor(baseUrl: string) {
    this.mcpUrl = `${baseUrl}/mcp`;
    const match = this.mcpUrl.match(/^https:\/\/([^/]+)(\/.*)?$/);
    this.parsedHost = match ? match[1] : 'dev.gofevo.com';
    this.parsedPath = match ? (match[2] || '/mcp') : '/mcp';
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.initialized) {
      if (!this.initPromise) {
        this.initPromise = this.doInit().then(() => {
          this.initialized = true;
          this.initPromise = null;
        }).catch((err) => {
          this.initPromise = null;
          throw err;
        });
      }
      await this.initPromise;
    }

    console.log(`[FevoMcpClient] ${toolName} (session: ${this.sessionId?.slice(0, 8)}...)`);

    let response: any;
    try {
      response = await this.httpPost({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      });
    } catch (err: any) {
      console.warn(`[FevoMcpClient] ${toolName} failed: ${err.message}, retrying...`);
      this.resetSession();
      await this.doInit();
      this.initialized = true;
      response = await this.httpPost({
        jsonrpc: '2.0',
        id: this.nextId++,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      });
    }

    if (!response) throw new Error(`MCP ${toolName}: no response`);
    if (response.error) throw new Error(`MCP ${toolName}: ${response.error.message || JSON.stringify(response.error)}`);

    const text = response.result?.content?.[0]?.text;
    if (!text) throw new Error(`MCP ${toolName}: no text content`);

    console.log(`[FevoMcpClient] ${toolName} OK (${text.length} chars)`);
    try { return JSON.parse(text); } catch { return text; }
  }

  resetSession(): void {
    this.sessionId = null;
    this.initialized = false;
    this.initPromise = null;
    this.nextId = 1;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async doInit(): Promise<void> {
    const resp = await this.httpPost({
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'fevo-event-feed-backend', version: '1.0' },
      },
    });
    if (!resp?.result) throw new Error('MCP init failed');
    console.log(`[FevoMcpClient] Session: ${this.sessionId?.slice(0, 8)}`);

    await this.httpPost({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }).catch(() => {});
  }

  private httpPost(body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const hasId = 'id' in body;
      let settled = false;

      const headers: Record<string, string | number> = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        Accept: 'text/event-stream, application/json',
        'User-Agent': BROWSER_UA,
      };
      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          req.destroy();
          reject(new Error(`MCP timeout (30s) for ${body.method}`));
        }
      }, 30_000);

      const doResolve = (value: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        // Abort the request to close the socket — stops the MCP SSE stream
        // from keeping the event loop busy
        req.destroy();
        resolve(value);
      };

      const doReject = (err: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      };

      const req = https.request(
        {
          hostname: this.parsedHost,
          port: 443,
          path: this.parsedPath,
          method: 'POST',
          headers,
        },
        (res) => {
          // Track session
          const sid = res.headers['mcp-session-id'];
          if (sid) this.sessionId = Array.isArray(sid) ? sid[0] : sid;

          // Handle HTTP errors
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            let errBody = '';
            res.on('data', (c) => { errBody += c; });
            res.on('end', () => {
              if (res.statusCode === 403 || res.statusCode === 401) this.resetSession();
              doReject(new Error(`MCP HTTP ${res.statusCode}: ${errBody.slice(0, 200)}`));
            });
            res.on('error', () => doReject(new Error(`MCP HTTP ${res.statusCode}`)));
            return;
          }

          // For notifications (no id), resolve immediately
          if (!hasId) {
            doResolve(null);
            return;
          }

          // For requests with id, parse the first SSE data event
          let buf = '';

          res.on('data', (chunk: Buffer) => {
            if (settled) return;
            buf += chunk.toString();

            const lines = buf.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  doResolve(parsed);
                  return;
                } catch { /* incomplete JSON, keep reading */ }
              }
            }
            buf = lines[lines.length - 1] || '';
          });

          res.on('end', () => {
            if (settled) return;
            for (const line of buf.split('\n')) {
              if (line.startsWith('data: ')) {
                try { doResolve(JSON.parse(line.slice(6))); return; } catch { /* */ }
              }
            }
            doResolve(null);
          });

          res.on('error', (err) => doReject(err));
        },
      );

      req.on('error', (err) => {
        // Only reject if we haven't settled yet — req.destroy() in doResolve
        // triggers this, but we've already resolved so we ignore it
        if (!settled) {
          doReject(err);
        }
      });

      req.write(postData);
      req.end();
    });
  }
}
