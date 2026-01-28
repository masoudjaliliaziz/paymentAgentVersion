import { useQuery } from "@tanstack/react-query";
import { loadSubCustomers } from "../api/getData";

export function useSubCustomers(CodeM2: string) {
  return useQuery({
    queryKey: ["subcustomer", CodeM2],
    queryFn: () => loadSubCustomers(CodeM2!),
    enabled: !!CodeM2, // فقط وقتی guid مقدار داره کوئری فعال میشه
  });
}
