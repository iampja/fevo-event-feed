/**
 * FEVO MCP Client
 *
 * Calls FEVO MCP server tools via the Streamable HTTP transport (JSON-RPC over SSE).
 * This replaces direct REST API calls that kept returning 404 for many endpoints.
 * The MCP server at /mcp wraps the FEVO API and provides reliable access to all tools.
 *
 * IMPORTANT: The MCP server returns Content-Type: text/event-stream. Node.js native
 * fetch will NOT resolve response.text() until the stream closes. We must read the
 * response body as a stream and parse SSE events as they arrive.
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
      const reqId = this.nextId++;
      response = await this.jsonRpcRequest(reqId, 'tools/call', {
        name: toolName,
        arguments: args,
      });
    } catch (err: any) {
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

    console.log(`[FevoMcpClient] Tool ${toolName} returned ${text.length} chars`);

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
    const initResp = await this.jsonRpcRequest(this.nextId++, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'fevo-event-feed-backend', version: '1.0' },
    });

    if (!initResp?.result) {
      throw new Error('MCP initialization failed: no result');
    }

    console.log(`[FevoMcpClient] Connected to ${initResp.result.serverInfo?.name} v${initResp.result.serverInfo?.version}`);

    // Send initialized notification (no response expected)
    await this.sendNotification('notifications/initialized', {});

    this.initialized = true;
  }

  private async jsonRpcRequest(
    id: number,
    method: string,
    params?: Record<string, any>,
  ): Promise<any> {
    const body: any = { jsonrpc: '2.0', id, method };
    if (params) body.params = params;
    return this.sendAndReadSSE(body);
  }

  private async sendNotification(
    method: string,
    params?: Record<string, any>,
  ): Promise<void> {
    const body: any = { jsonrpc: '2.0', method };
    if (params) body.params = params;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
      'User-Agent': BROWSER_UA,
    };
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    // Fire-and-forget for notifications — don't wait for response body
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const resp = await fetch(this.mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const newSession = resp.headers.get('mcp-session-id');
      if (newSession) this.sessionId = newSession;
      // Consume and discard body to free the connection
      if (resp.body) {
        const reader = resp.body.getReader();
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
    } catch {
      // Notifications are best-effort
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Send a JSON-RPC request and read the SSE response as a stream.
   * This is critical: Node.js native fetch won't resolve response.text()
   * on SSE streams until the connection closes. We read chunk-by-chunk
   * and return as soon as we find a "data: {...}" line with a JSON-RPC response.
   */
  private async sendAndReadSSE(body: any): Promise<any> {
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
      if (this.initialized && err.name !== 'AbortError') {
        this.resetSession();
      }
      throw err;
    }

    // Capture session ID
    const newSessionId = response.headers.get('mcp-session-id');
    if (newSessionId) {
      this.sessionId = newSessionId;
    }

    if (!response.ok) {
      clearTimeout(timeout);
      // Try to read error body quickly
      let errorText = '';
      try {
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          const { value } = await reader.read();
          if (value) errorText = decoder.decode(value).slice(0, 300);
          reader.cancel().catch(() => {});
        }
      } catch { /* ignore */ }
      if (response.status === 403 || response.status === 401) {
        this.resetSession();
      }
      throw new Error(`MCP HTTP ${response.status}: ${errorText}`);
    }

    // Read SSE stream chunk-by-chunk, looking for "data: " lines
    if (!response.body) {
      clearTimeout(timeout);
      throw new Error('MCP: no response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for complete SSE data lines
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              // Found a valid JSON-RPC response — cancel the stream and return
              reader.cancel().catch(() => {});
              clearTimeout(timeout);
              return parsed;
            } catch {
              // Not valid JSON, continue reading
            }
          }
        }

        // Keep only the last incomplete line in buffer
        buffer = lines[lines.length - 1] || '';
      }
    } finally {
      clearTimeout(timeout);
    }

    // No JSON-RPC response found in stream
    return null;
  }
}
