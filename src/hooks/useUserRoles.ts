// hooks/useUserRoles.ts
import { useMemo } from "react";
import { Agents, Masters } from "../constants/userRoles";

export function useUserRoles(username: string | null) {
  const isAgent = useMemo(
    () => username !== null && Agents.includes(username),
    [username]
  );
  const isMaster = useMemo(
    () => username !== null && Masters.includes(username),
    [username]
  );
  return { isAgent, isMaster };
}
