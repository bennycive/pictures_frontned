import { useEffect, useRef, useCallback } from 'react';
import type { Auction } from '../api/types';

/** Shape of every message the server pushes over the WebSocket */
interface AuctionSocketMessage {
  type: 'bid_placed' | 'auction_started' | 'auction_ended' | 'auction_update' | string;
  // Common bid-update fields
  current_price?: string;
  minimum_next_bid?: string;
  total_bids?: number;
  top_bids?: string;
  winner_name?: string;
  status?: Auction['status'];
  // Some backends send the full auction object
  auction?: Partial<Auction>;
  // Error frame
  error?: string;
}

type AuctionPatch = Partial<Pick<Auction, 'current_price' | 'minimum_next_bid' | 'total_bids' | 'top_bids' | 'winner_name' | 'status'>>;

interface Options {
  /** Called whenever the server sends a live update */
  onUpdate: (patch: AuctionPatch) => void;
  /** Called when we receive an error frame from the server */
  onError?: (msg: string) => void;
  /** Reconnect delay in ms (default 3000) */
  reconnectDelay?: number;
}

/**
 * Connects to  ws[s]://<host>/ws/auctions/<uuid>/
 * Applies exponential back-off reconnection (up to ~30 s).
 * Automatically closes on unmount.
 */
export function useAuctionSocket(uuid: string | undefined, { onUpdate, onError, reconnectDelay = 3000 }: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const unmountedRef = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!uuid || unmountedRef.current) return;

    // Build WS URL — in dev Vite proxies /ws/* so we use a relative ws://
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;                   // e.g. localhost:5173
    const url = `${protocol}://${host}/ws/auctions/${uuid}/`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptsRef.current = 0; // reset back-off on successful connect
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: AuctionSocketMessage;
      try {
        msg = JSON.parse(event.data as string) as AuctionSocketMessage;
      } catch {
        return; // ignore malformed frames
      }

      if (msg.error) {
        onError?.(msg.error);
        return;
      }

      // Support backends that send either top-level fields or a nested auction object
      const src = msg.auction ?? msg;

      const patch: AuctionPatch = {};
      if (src.current_price   !== undefined) patch.current_price    = src.current_price;
      if (src.minimum_next_bid !== undefined) patch.minimum_next_bid = src.minimum_next_bid;
      if (src.total_bids       !== undefined) patch.total_bids       = src.total_bids;
      if (src.top_bids         !== undefined) patch.top_bids         = src.top_bids;
      if (src.winner_name      !== undefined) patch.winner_name      = src.winner_name;
      if (src.status           !== undefined) patch.status           = src.status;

      if (Object.keys(patch).length > 0) onUpdate(patch);
    };

    ws.onerror = () => {
      // onerror always fires before onclose — nothing to do here
    };

    ws.onclose = (ev) => {
      if (unmountedRef.current) return;
      // Don't reconnect if the server closed cleanly (1000) or policy (1008)
      if (ev.code === 1000 || ev.code === 1008) return;

      // Exponential back-off: 3s → 6s → 12s … capped at 30s
      const delay = Math.min(reconnectDelay * Math.pow(2, attemptsRef.current), 30000);
      attemptsRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, [uuid, onUpdate, onError, reconnectDelay]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000, 'unmount');
      wsRef.current = null;
    };
  }, [connect]);
}
