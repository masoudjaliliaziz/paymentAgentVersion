// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

const fetchPayments = async (guid: string): Promise<PaymentType[]> => {
  const res = await fetch(
    `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items?$filter=parentGUID eq '${guid}'`,
    { headers: { Accept: "application/json;odata=verbose" } }
  );
  const data = await res.json();
  return data.d.results;
};

export const usePayment = (guid: string) => {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error,
    PaymentType[],
    [string, string]
  >({
    queryKey: ["payments", guid],
    queryFn: () => fetchPayments(guid),
    enabled: !!guid,
    refetchInterval: 1000,
  });

  return { isLoading, isError, data, error, refetch, isFetching };
};
