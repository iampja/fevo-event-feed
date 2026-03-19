/**
 * FEVO MCP Client
 *
 * Calls FEVO MCP server tools via JSON-RPC over HTTP.
 * Uses Node.js native https.request instead of fetch to avoid issues
 * with SSE stream handling in Node's native fetch (undici).
 */

import https from 'https';
import { URL } from 'url';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class FevoMcpClient {
  private mcpUrl: string;
  private sessionId: string | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private nextId = 1;

  constructor(baseUrl: string) {
    this.mcpUrl = `${baseUrl}/mcp`;
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.initialized) {
      if (!this.initPromise) {
        this.initPromise = this.initialize().finally(() => {
          this.initPromise = null;
        });
      }
      await this.initPromise;
    }

    console.log(`[FevoMcpClient] Calling tool: ${toolName}`);

    let response: any;
    try {
      response = await this.sendJsonRpc(this.nextId++, 'tools/call', {
        name: toolName,
        arguments: args,
      });
    } catch (err: any) {
      console.warn(`[FevoMcpClient] Tool ${toolName} failed (${err.message}), retrying with fresh session`);
      this.resetSession();
      await this.initialize();
      response = await this.sendJsonRpc(this.nextId++, 'tools/call', {
        name: toolName,
        arguments: args,
      });
    }

    if (!response) {
      throw new Error(`MCP tool ${toolName}: no response`);
    }
    if (response.error) {
      throw new Error(`MCP tool ${toolName}: ${response.error.message || JSON.stringify(response.error)}`);
    }

    const text = response.result?.content?.[0]?.text;
    if (!text) {
      throw new Error(`MCP tool ${toolName}: no text content`);
    }

    console.log(`[FevoMcpClient] Tool ${toolName} OK (${text.length} chars)`);

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  resetSession(): void {
    this.sessionId = null;
    this.initialized = false;
    this.initPromise = null;
    this.nextId = 1;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    const initResp = await this.sendJsonRpc(this.nextId++, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'fevo-event-feed-backend', version: '1.0' },
    });

    if (!initResp?.result) {
      throw new Error('MCP initialization failed');
    }

    console.log(`[FevoMcpClient] Connected to ${initResp.result.serverInfo?.name}`);

    // Send initialized notification (fire-and-forget)
    this.sendJsonRpcNotification('notifications/initialized', {}).catch(() => {});
    // Small delay to let notification process
    await new Promise((r) => setTimeout(r, 100));

    this.initialized = true;
  }

  private sendJsonRpc(id: number, method: string, params?: any): Promise<any> {
    const body: any = { jsonrpc: '2.0', id, method };
    if (params) body.params = params;
    return this.httpPost(body);
  }

  private sendJsonRpcNotification(method: string, params?: any): Promise<any> {
    const body: any = { jsonrpc: '2.0', method };
    if (params) body.params = params;
    return this.httpPost(body);
  }

  /**
   * Make an HTTPS POST to the MCP server and read the SSE response.
   * Uses Node.js native https.request which gives explicit control over
   * the response stream (unlike fetch/undici which can hang on SSE).
   */
  private httpPost(body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(this.mcpUrl);
      const postData = JSON.stringify(body);

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Accept: 'text/event-stream, application/json',
          'User-Agent': BROWSER_UA,
          ...(this.sessionId ? { 'Mcp-Session-Id': this.sessionId } : {}),
        },
      };

      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('MCP request timed out (60s)'));
      }, 60_000);

      const req = https.request(options, (res) => {
        // Capture session ID
        const newSession = res.headers['mcp-session-id'];
        if (newSession) {
          this.sessionId = Array.isArray(newSession) ? newSession[0] : newSession;
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errorBody = '';
          res.on('data', (chunk) => { errorBody += chunk.toString(); });
          res.on('end', () => {
            clearTimeout(timer);
            if (res.statusCode === 403 || res.statusCode === 401) {
              this.resetSession();
            }
            reject(new Error(`MCP HTTP ${res.statusCode}: ${errorBody.slice(0, 300)}`));
          });
          return;
        }

        // Read response data, looking for SSE "data: " lines
        let buffer = '';
        let resolved = false;

        res.on('data', (chunk) => {
          if (resolved) return;
          buffer += chunk.toString();

          // Check for complete SSE data lines
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                resolved = true;
                clearTimeout(timer);
                res.destroy(); // Close the connection immediately
                resolve(parsed);
                return;
              } catch {
                // Not valid JSON, keep reading
              }
            }
          }
          // Keep only the last potentially-incomplete line
          buffer = lines[lines.length - 1] || '';
        });

        res.on('end', () => {
          clearTimeout(timer);
          if (!resolved) {
            // Try to parse whatever we have
            for (const line of buffer.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  resolve(JSON.parse(line.slice(6)));
                  return;
                } catch { /* ignore */ }
              }
            }
            resolve(null);
          }
        });

        res.on('error', (err) => {
          clearTimeout(timer);
          if (!resolved) reject(err);
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
}
