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
    // Pre-parse URL to avoid using URL constructor
    const match = this.mcpUrl.match(/^https:\/\/([^/]+)(\/.*)?$/);
    this.parsedHost = match ? match[1] : 'dev.gofevo.com';
    this.parsedPath = match ? (match[2] || '/mcp') : '/mcp';
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    // Ensure initialized (with mutex for concurrent calls)
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
      // Retry once with fresh session
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

  /** Force a fresh MCP session on the next call */
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

    // Send initialized notification (don't await response parsing)
    await this.httpPost({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }).catch(() => {});
  }

  private httpPost(body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(body);
      const hasId = 'id' in body; // Notifications don't have id

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
        req.destroy();
        reject(new Error(`MCP timeout (30s) for ${body.method}`));
      }, 30_000);

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

          // Handle errors
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
              clearTimeout(timer);
              if (res.statusCode === 403 || res.statusCode === 401) this.resetSession();
              reject(new Error(`MCP HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
            });
            res.on('error', () => { clearTimeout(timer); reject(new Error(`MCP HTTP ${res.statusCode}`)); });
            return;
          }

          // For notifications (no id), destroy immediately and resolve
          if (!hasId) {
            clearTimeout(timer);
            res.destroy();
            resolve(null);
            return;
          }

          // For requests with id, parse SSE data events
          let buf = '';
          let done = false;

          res.on('data', (chunk: Buffer) => {
            if (done) return;
            buf += chunk.toString();

            const lines = buf.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  done = true;
                  clearTimeout(timer);
                  res.destroy(); // Kill connection immediately — don't drain
                  resolve(parsed);
                  return;
                } catch { /* not json yet */ }
              }
            }
            // Keep last potentially-incomplete line
            buf = lines[lines.length - 1] || '';
          });

          res.on('end', () => {
            clearTimeout(timer);
            if (!done) {
              // Final attempt to parse
              for (const line of buf.split('\n')) {
                if (line.startsWith('data: ')) {
                  try { resolve(JSON.parse(line.slice(6))); return; } catch { /* */ }
                }
              }
              resolve(null);
            }
          });

          res.on('error', (err) => {
            clearTimeout(timer);
            if (!done) reject(err);
          });
        },
      );

      req.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
}
