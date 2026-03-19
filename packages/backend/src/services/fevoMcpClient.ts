/**
 * FEVO MCP Client
 *
 * Calls FEVO MCP server tools via JSON-RPC over HTTP.
 * Uses Node.js native https module with fresh sessions per call batch
 * to avoid session corruption from abrupt connection closes.
 */

import https from 'https';
import { URL } from 'url';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class FevoMcpClient {
  private mcpUrl: string;

  constructor(baseUrl: string) {
    this.mcpUrl = `${baseUrl}/mcp`;
  }

  /**
   * Call an MCP tool. Each call gets a FRESH session (initialize → call).
   * This avoids session state corruption from prior calls.
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    console.log(`[FevoMcpClient] Calling tool: ${toolName}`);

    // Fresh session for every call — avoids stale/corrupted sessions
    const { sessionId } = await this.initSession();

    const response = await this.sendJsonRpc(sessionId, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    });

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

  // Kept for API compatibility
  resetSession(): void {}

  // ── Private ─────────────────────────────────────────────────────────────────

  private async initSession(): Promise<{ sessionId: string }> {
    // Step 1: Initialize
    const initResp = await this.sendJsonRpc(null, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'fevo-event-feed-backend', version: '1.0' },
      },
    });

    if (!initResp?.__sessionId) {
      throw new Error('MCP initialization failed: no session ID');
    }

    const sessionId = initResp.__sessionId;

    // Step 2: Send initialized notification
    await this.sendJsonRpc(sessionId, {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    });

    return { sessionId };
  }

  /**
   * Send a JSON-RPC message to the MCP server via HTTPS POST.
   * Reads the SSE response stream chunk-by-chunk and returns the
   * first valid JSON-RPC data event. Attaches __sessionId to the
   * parsed result for session tracking.
   */
  private sendJsonRpc(sessionId: string | null, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(this.mcpUrl);
      const postData = JSON.stringify(body);

      const headers: Record<string, string | number> = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        Accept: 'text/event-stream, application/json',
        'User-Agent': BROWSER_UA,
      };
      if (sessionId) {
        headers['Mcp-Session-Id'] = sessionId;
      }

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers,
      };

      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('MCP request timed out (60s)'));
      }, 60_000);

      const req = https.request(options, (res) => {
        // Capture session ID from response
        const newSession = res.headers['mcp-session-id'];
        const respSessionId = Array.isArray(newSession) ? newSession[0] : newSession || sessionId;

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errorBody = '';
          res.on('data', (chunk) => { errorBody += chunk.toString(); });
          res.on('end', () => {
            clearTimeout(timer);
            reject(new Error(`MCP HTTP ${res.statusCode}: ${errorBody.slice(0, 300)}`));
          });
          res.on('error', () => {
            clearTimeout(timer);
            reject(new Error(`MCP HTTP ${res.statusCode}`));
          });
          return;
        }

        let buffer = '';
        let resolved = false;

        res.on('data', (chunk) => {
          if (resolved) return;
          buffer += chunk.toString();

          // Look for SSE "data: " lines with valid JSON
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const result = JSON.parse(line.slice(6));
                resolved = true;
                clearTimeout(timer);
                // Attach session ID to result for tracking
                result.__sessionId = respSessionId;
                // Let the response drain naturally instead of destroying
                res.resume();
                resolve(result);
                return;
              } catch {
                // Not valid JSON, keep reading
              }
            }
          }
          buffer = lines[lines.length - 1] || '';
        });

        res.on('end', () => {
          clearTimeout(timer);
          if (!resolved) {
            // For notifications, there may be no data events
            resolve({ __sessionId: respSessionId });
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
