import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = `${import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'http')}/ws`;

/**
 * Connects to the Spring STOMP WebSocket and invalidates React Query caches
 * whenever the backend broadcasts a KOT or table update.
 *
 * @param {number|string} branchId  — subscribe only for this branch
 */
export function useWebSocket(branchId) {
  const queryClient = useQueryClient();
  const clientRef   = useRef(null);

  useEffect(() => {
    if (!branchId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),

      reconnectDelay: 5000,   // auto-reconnect after 5 s

      onConnect: () => {
        console.log('[WS] connected');

        // ── KOT updates (kitchen screen) ──
        client.subscribe(`/topic/kots/${branchId}`, () => {
          queryClient.invalidateQueries({ queryKey: ['kots', branchId] });
        });

        // ── Table refresh (captain dashboard) ──
        client.subscribe(`/topic/tables/${branchId}`, () => {
          queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
          queryClient.invalidateQueries({ queryKey: ['kots',   branchId] });
        });
      },

      onDisconnect: () => console.log('[WS] disconnected'),
      onStompError:  frame => console.error('[WS] error', frame),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [branchId, queryClient]);
}
