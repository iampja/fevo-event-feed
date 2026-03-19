/**
 * FEVO MCP Client
 *
 * Calls FEVO MCP server tools via the Streamable HTTP transport (JSON-RPC over SSE).
 * This replaces direct REST API calls that kept returning 404 for many endpoints.
 * The MCP server at /mcp wraps the FEVO API and provides reliable access to all tools.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export class FevoMcpClient {
  private mcpUrl: string;
  private sessionId: string | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private nextId = 1;

  constructor(baseUrl: string) {
    // MCP endpoint is at /mcp on the FEVO server
    this.mcpUrl = `${baseUrl}/mcp`;
  }

  /**
   * Call an MCP tool by name with the given arguments.
   * Handles session initialization automatically on first call.
   * Returns the parsed JSON result from the tool's text content.
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.initialized) {
      // Mutex: only one initialize at a time
      if (!this.initPromise) {
        this.initPromise = this.initialize().finally(() => {
          this.initPromise = null;
        });
      }
      await this.initPromise;
    }

    let response: any;
    try {
      const reqId = this.nextId++;
      response = await this.jsonRpcRequest(reqId, 'tools/call', {
        name: toolName,
        arguments: args,
      });
    } catch (err: any) {
      // Session might have expired — reset and retry once
      console.warn(`[FevoMcpClient] Tool ${toolName} failed, retrying with fresh session:`, err.message);
      this.resetSession();
      await this.initialize();
      const reqId = this.nextId++;
      response = await this.jsonRpcRequest(reqId, 'tools/call', {
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

    const content = response.result?.content;
    if (!content || !Array.isArray(content) || content.length === 0) {
      throw new Error(`MCP tool ${toolName}: empty content`);
    }

    const text = content[0]?.text;
    if (!text) {
      throw new Error(`MCP tool ${toolName}: no text in content`);
    }

    try {
      return JSON.parse(text);
    } catch {
      // Return raw text if not JSON
      return text;
    }
  }

  /**
   * Reset session so the next call re-initializes.
   */
  resetSession(): void {
    this.sessionId = null;
    this.initialized = false;
    this.initPromise = null;
    this.nextId = 1;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    // Step 1: Send initialize request
    const initResp = await this.jsonRpcRequest(this.nextId++, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'fevo-event-feed-backend', version: '1.0' },
    });

    if (!initResp?.result) {
      throw new Error('MCP initialization failed: no result');
    }

    console.log(`[FevoMcpClient] Connected to ${initResp.result.serverInfo?.name} v${initResp.result.serverInfo?.version}`);

    // Step 2: Send initialized notification (no id = notification, no response expected)
    await this.jsonRpcNotification('notifications/initialized', {});

    this.initialized = true;
  }

  private async jsonRpcRequest(
    id: number,
    method: string,
    params?: Record<string, any>,
  ): Promise<any> {
    const body: any = { jsonrpc: '2.0', id, method };
    if (params) body.params = params;
    return this.sendRequest(body);
  }

  private async jsonRpcNotification(
    method: string,
    params?: Record<string, any>,
  ): Promise<void> {
    const body: any = { jsonrpc: '2.0', method };
    if (params) body.params = params;
    await this.sendRequest(body);
  }

  private async sendRequest(body: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
      'User-Agent': BROWSER_UA,
    };
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let response: Response;
    try {
      response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      // If session expired, reset and retry once
      if (this.initialized && err.name !== 'AbortError') {
        console.warn('[FevoMcpClient] Request failed, resetting session:', err.message);
        this.resetSession();
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    // Capture session ID from response headers
    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      // If 403/session-related, reset session for next attempt
      if (response.status === 403 || response.status === 401) {
        this.resetSession();
      }
      throw new Error(`MCP HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    // Parse SSE response — look for "data: " lines containing JSON-RPC
    const raw = await response.text();
    for (const line of raw.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          return JSON.parse(line.slice(6));
        } catch {
          // Not JSON, continue
        }
      }
    }

    // For notifications, there may be no parseable response
    return null;
  }
}
