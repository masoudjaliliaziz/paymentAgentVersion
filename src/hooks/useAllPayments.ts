// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

const fetchAllPayments = async (): Promise<PaymentType[]> => {
  const res = await fetch(
    `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items`,
    { headers: { Accept: "application/json;odata=verbose" } }
  );
  const data = await res.json();
  return data.d.results;
};

export const useAllPayment = () => {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error,
    PaymentType[]
   
  >({
    queryKey: ["payments"],
    queryFn: () => fetchAllPayments(),
    refetchInterval: 1000,
  });

  return { isLoading, isError, data, error, refetch, isFetching };
};
