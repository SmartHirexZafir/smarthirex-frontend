// lib/sse.ts
// Tiny Server-Sent Events (SSE) client with reconnection, heartbeats, and JSON parsing.
// - Works with cookies (middleware-compatible). Optionally appends token as a query param.
// - Safe to import on the server (no side effects at module scope).
// - React hooks are lazy-required so this file doesn't force "use client".
// - URL resolution is consistent with lib/auth.ts (API_BASE).

import { API_BASE, getClientToken } from "@/lib/auth";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export type SSEParseMode = "auto" | "json" | "text" | "ndjson";

export type SSEMessage<T = unknown> = {
  /** event name if you subscribed via addEventListener('name', ...) */
  event?: string;
  /** data payload — parsed according to parse mode (can be text) */
  data: T | string;
  /** raw event */
  raw: MessageEvent<string>;
  /** Last-Event-ID if provided by the server */
  id?: string | null;
};

export type SSEHandlers<T = unknown> = {
  onOpen?: (ev: Event) => void;
  onMessage?: (msg: SSEMessage<T>) => void;
  /** Fired for named events you subscribed via `events` option; receives event name + parsed payload */
  onEvent?: (event: string, msg: SSEMessage<T>) => void;
  onError?: (ev: Event) => void;
  /** Called when we intentionally close (controller.close()) or give up reconnecting */
  onClose?: (reason: "manual" | "heartbeat-timeout" | "max-retries" | "error") => void;
};

export type SSEOptions = {
  /** If path is relative, it will be resolved against API_BASE from lib/auth.ts */
  baseUrl?: string;
  /** Query params to append to the SSE URL */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Listen for custom named events (server `event: name`) in addition to 'message' */
  events?: string[];
  /** Send cookies for cross-origin EventSource */
  withCredentials?: boolean;
  /** Attempt to parse data as JSON automatically (default), or force text/ndjson/json */
  parse?: SSEParseMode;
  /** If true, append token as ?token=... (useful when backend doesn't read cookies). Default false. */
  attachTokenAsQueryParam?: boolean;
  /** Initial reconnect delay (ms). Default 1000 */
  retryInitialMs?: number;
  /** Maximum reconnect delay (ms). Default 15000 */
  retryMaxMs?: number;
  /** Heartbeat/keepalive timeout (ms). If no messages within this window, we reconnect. Default 25000 */
  keepaliveMs?: number;
  /** Provide a Last-Event-ID to resume (will be appended as query param `lastEventId`) */
  lastEventId?: string;
  /** Cap number of retries; 0 = infinite. Default 0 (infinite). */
  maxRetries?: number;
};

export type SSEController = {
  /** Current URL used (resolved) */
  url: string;
  /** Close the stream and stop auto-reconnect */
  close: () => void;
  /** Force an immediate reconnect (resets backoff) */
  reconnectNow: () => void;
  /** Update handlers without recreating the connection */
  setHandlers: (h: SSEHandlers) => void;
  /** True when EventSource is open */
  isConnected: () => boolean;
  /** How many times we've retried */
  retryCount: () => number;
};

// ---------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------
const isBrowser = typeof window !== "undefined";

function resolveUrl(pathOrUrl: string, baseUrl?: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = (baseUrl || API_BASE || "").replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function buildQuery(
  qs: Record<string, string | number | boolean | undefined | null> | undefined
) {
  const usp = new URLSearchParams();
  if (qs) {
    Object.entries(qs).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      usp.set(k, String(v));
    });
  }
  return usp.toString();
}

function addQueryToUrl(url: string, qs?: Record<string, any>) {
  if (!qs || Object.keys(qs).length === 0) return url;
  const u = new URL(url);
  const curr = new URLSearchParams(u.search);
  Object.entries(qs).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    curr.set(k, String(v));
  });
  u.search = curr.toString();
  return u.toString();
}

function tryParse<T = unknown>(raw: string, mode: SSEParseMode): T | string {
  const s = typeof raw === "string" ? raw : "";

  if (mode === "text") return s;
  if (mode === "json") {
    try {
      return JSON.parse(s) as T;
    } catch {
      return s;
    }
  }
  if (mode === "ndjson") {
    // Return array of items if NDJSON
    const lines = s.split(/\r?\n/).filter(Boolean);
    const parsed = lines.map((ln) => {
      try {
        return JSON.parse(ln);
      } catch {
        return ln;
      }
    });
    return parsed as unknown as T;
  }

  // auto: try JSON first; fallback to text
  try {
    return JSON.parse(s) as T;
  } catch {
    return s;
  }
}

function jitteredBackoff(attempt: number, min: number, max: number) {
  const exp = Math.min(max, min * Math.pow(2, attempt));
  const jitter = exp * 0.4 * Math.random(); // 40% jitter
  return Math.round(exp - jitter);
}

// ---------------------------------------------------------
// Core: connectSSE
// ---------------------------------------------------------
export function connectSSE<T = unknown>(
  pathOrUrl: string,
  handlers: SSEHandlers<T> = {},
  options: SSEOptions = {}
): SSEController {
  // If not in the browser, return a no-op controller to keep SSR safe
  if (!isBrowser) {
    return {
      url: resolveUrl(pathOrUrl, options.baseUrl),
      close: () => {},
      reconnectNow: () => {},
      setHandlers: () => {},
      isConnected: () => false,
      retryCount: () => 0,
    };
  }

  let es: EventSource | null = null;
  let closed = false;
  let connected = false;
  let retries = 0;
  let heartbeatTimer: number | null = null;
  let currentHandlers: SSEHandlers<T> = { ...handlers };

  const {
    baseUrl,
    events = [],
    withCredentials = true,
    parse = "auto",
    attachTokenAsQueryParam = false,
    retryInitialMs = 1000,
    retryMaxMs = 15000,
    keepaliveMs = 25000,
    lastEventId,
    maxRetries = 0,
  } = options;

  // Build URL + query
  const resolvedUrl = resolveUrl(pathOrUrl, baseUrl);
  const baseQuery: Record<string, any> = { ...options.query };
  if (lastEventId) baseQuery.lastEventId = lastEventId;
  if (attachTokenAsQueryParam) {
    const token = getClientToken();
    if (token) baseQuery.token = token;
  }
  const finalUrl = addQueryToUrl(resolvedUrl, baseQuery);

  function clearHeartbeat() {
    if (heartbeatTimer) {
      window.clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function armHeartbeat() {
    clearHeartbeat();
    if (keepaliveMs > 0) {
      heartbeatTimer = window.setTimeout(() => {
        // No messages for too long -> reconnect
        cleanupSource();
        if (!closed) {
          if (currentHandlers.onClose) currentHandlers.onClose("heartbeat-timeout");
          scheduleReconnect();
        }
      }, keepaliveMs) as unknown as number;
    }
  }

  function cleanupSource() {
    clearHeartbeat();
    if (es) {
      try {
        es.close();
      } catch {}
      es = null;
    }
    connected = false;
  }

  function handleOpen(ev: Event) {
    retries = 0;
    connected = true;
    armHeartbeat();
    currentHandlers.onOpen?.(ev);
  }

  function handleError(ev: Event) {
    // Browsers re-emit 'error' for network hiccups; we reconnect with backoff
    currentHandlers.onError?.(ev);
    if (!closed) {
      cleanupSource();
      scheduleReconnect();
    }
  }

  function handleAnyMessage(evt: MessageEvent<string>, eventName?: string) {
    armHeartbeat();
    const msg: SSEMessage<T> = {
      event: eventName,
      data: tryParse<T>(evt.data, parse),
      raw: evt,
      id: (evt as any).lastEventId ?? null,
    };

    if (eventName) {
      currentHandlers.onEvent?.(eventName, msg);
    } else {
      currentHandlers.onMessage?.(msg);
    }
  }

  function open() {
    if (closed) return;
    cleanupSource(); // safety
    try {
      es = new EventSource(finalUrl, { withCredentials });
    } catch (e) {
      // Construction failed (bad URL, etc.) -> schedule reconnect
      currentHandlers.onError?.(e as any);
      scheduleReconnect();
      return;
    }

    es.onopen = handleOpen as any;
    es.onerror = handleError as any;
    es.onmessage = (evt: MessageEvent<string>) => handleAnyMessage(evt);

    // Listen to named events if requested
    events.forEach((evName) => {
      es!.addEventListener(evName, (evt: MessageEvent<string>) =>
        handleAnyMessage(evt, evName)
      );
    });
  }

  function scheduleReconnect() {
    if (closed) return;
    if (maxRetries > 0 && retries >= maxRetries) {
      currentHandlers.onClose?.("max-retries");
      return;
    }
    const delay = jitteredBackoff(retries++, retryInitialMs, retryMaxMs);
    window.setTimeout(() => {
      if (!closed) open();
    }, delay);
  }

  function close(reason: "manual" | "heartbeat-timeout" | "max-retries" | "error" = "manual") {
    closed = true;
    cleanupSource();
    currentHandlers.onClose?.(reason);
  }

  function reconnectNow() {
    if (closed) return;
    retries = 0;
    cleanupSource();
    open();
  }

  function isConnected() {
    return connected;
  }

  function retryCount() {
    return retries;
  }

  function setHandlers(h: SSEHandlers<T>) {
    currentHandlers = { ...currentHandlers, ...h };
  }

  // Kick off connection
  open();

  return { url: finalUrl, close, reconnectNow, setHandlers, isConnected, retryCount };
}

// ---------------------------------------------------------
// React hooks (lazy required, keep this module SSR-safe)
// ---------------------------------------------------------

export type UseSSEState<T = unknown> = {
  /** last message received (parsed) */
  message: T | string | null;
  /** all messages (optional) */
  messages: Array<T | string>;
  /** is EventSource in OPEN state */
  isConnected: boolean;
  /** reconnect now */
  reconnect: () => void;
  /** close the stream */
  close: () => void;
  /** error flag (last onError seen) */
  error: unknown | null;
};

/**
 * useSSE — simple hook to subscribe to an SSE endpoint.
 * Example:
 *   const { message, isConnected, reconnect } = useSSE("/dashboard/stream", { parse: "auto" });
 */
export function useSSE<T = unknown>(
  pathOrUrl: string,
  opts: SSEOptions & { captureAll?: boolean } = {}
): UseSSEState<T> {
  // Lazy import React so this file doesn't force "use client"
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react") as typeof import("react");
  const { useEffect, useRef, useState } = React;

  const [message, setMessage] = useState<T | string | null>(null);
  const [messages, setMessages] = useState<Array<T | string>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const controllerRef = useRef<SSEController | null>(null);

  useEffect(() => {
    const c = connectSSE<T>(
      pathOrUrl,
      {
        onOpen: () => {
          setIsConnected(true);
          setError(null);
        },
        onMessage: (m) => {
          setMessage(m.data);
          if (opts.captureAll) setMessages((prev) => [...prev, m.data]);
        },
        onError: (e) => {
          setIsConnected(false);
          setError(e);
        },
        onClose: () => {
          setIsConnected(false);
        },
      },
      opts
    );

    controllerRef.current = c;
    return () => {
      c.close();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathOrUrl,
    // stringify options that would affect URL/behavior
    JSON.stringify({
      baseUrl: opts.baseUrl,
      query: opts.query,
      events: opts.events,
      withCredentials: opts.withCredentials,
      parse: opts.parse,
      attachTokenAsQueryParam: opts.attachTokenAsQueryParam,
      retryInitialMs: opts.retryInitialMs,
      retryMaxMs: opts.retryMaxMs,
      keepaliveMs: opts.keepaliveMs,
      lastEventId: opts.lastEventId,
      maxRetries: opts.maxRetries,
    }),
  ]);

  return {
    message,
    messages,
    isConnected,
    error,
    reconnect: () => controllerRef.current?.reconnectNow(),
    close: () => controllerRef.current?.close(),
  };
}

/**
 * useSSEChannel — subscribe to a specific named event (server `event: name`).
 * `pathOrUrl` same as useSSE; include the name in `eventName`.
 */
export function useSSEChannel<T = unknown>(
  pathOrUrl: string,
  eventName: string,
  opts: Omit<SSEOptions, "events"> = {}
): UseSSEState<T> & { event: string } {
  // Lazy import React
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react") as typeof import("react");
  const { useEffect, useRef, useState } = React;

  const [message, setMessage] = useState<T | string | null>(null);
  const [messages, setMessages] = useState<Array<T | string>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const controllerRef = useRef<SSEController | null>(null);

  useEffect(() => {
    const c = connectSSE<T>(
      pathOrUrl,
      {
        onOpen: () => {
          setIsConnected(true);
          setError(null);
        },
        onEvent: (ev, m) => {
          if (ev === eventName) {
            setMessage(m.data);
            setMessages((prev) => [...prev, m.data]);
          }
        },
        onError: (e) => {
          setIsConnected(false);
          setError(e);
        },
        onClose: () => setIsConnected(false),
      },
      { ...opts, events: [eventName] }
    );

    controllerRef.current = c;
    return () => {
      c.close();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathOrUrl,
    eventName,
    JSON.stringify({
      baseUrl: opts.baseUrl,
      query: opts.query,
      withCredentials: opts.withCredentials,
      parse: opts.parse,
      attachTokenAsQueryParam: opts.attachTokenAsQueryParam,
      retryInitialMs: opts.retryInitialMs,
      retryMaxMs: opts.retryMaxMs,
      keepaliveMs: opts.keepaliveMs,
      lastEventId: opts.lastEventId,
      maxRetries: opts.maxRetries,
    }),
  ]);

  return {
    event: eventName,
    message,
    messages,
    isConnected,
    error,
    reconnect: () => controllerRef.current?.reconnectNow(),
    close: () => controllerRef.current?.close(),
  };
}
