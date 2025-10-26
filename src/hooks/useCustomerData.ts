import { useQuery } from "@tanstack/react-query";
import { loadCurrentUser } from "../api/getData";

export function useCustomers(guid: string | null | undefined) {
  return useQuery({
    queryKey: ["customers", guid],
    queryFn: () => loadCurrentUser(guid!),
    enabled: !!guid, // فقط وقتی guid مقدار داره کوئری فعال میشه
  });
}
