// src/hooks/useCurrentUser.ts
import { useQuery } from "@tanstack/react-query";

declare const _spPageContextInfo: {
  webAbsoluteUrl: string;
  [key: string]: unknown;
};

async function fetchCurrentUser(): Promise<string> {
  const res = await fetch(
    `${_spPageContextInfo.webAbsoluteUrl}/_api/web/currentuser`,
    {
      headers: { Accept: "application/json;odata=verbose" },
      credentials: "same-origin",
    }
  );
  if (!res.ok) throw new Error("کاربر یافت نشد");
  const data = await res.json();
  return data.d.LoginName as string;
}

export function useCurrentUser() {
  return useQuery<string, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    // optional
  });
}
