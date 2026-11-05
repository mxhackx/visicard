"use client";

import { useCallback } from "react";
import { useFile } from "../../app/context/FileContext";

import { API_URL } from "@/lib/api-url";

export { API_URL };

/** fetch vers l'API avec le jeton admin, et un seul nouvel essai après rafraîchissement du jeton. */
export function useAdminFetch(adminToken: string) {
  const { refreshAccessToken } = useFile();

  return useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const send = (token: string) =>
        fetch(`${API_URL}${path}`, {
          ...init,
          credentials: "include",
          headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
        });

      let res = await send(adminToken);
      if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) res = await send(refreshed);
      }
      return res;
    },
    [adminToken, refreshAccessToken],
  );
}
