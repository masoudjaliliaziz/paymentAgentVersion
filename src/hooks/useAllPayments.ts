// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

interface SharePointResponse {
  d: {
    results: PaymentType[];
    __next?: string;
  };
}

const fetchAllPayments = async (): Promise<PaymentType[]> => {
  const allPayments: PaymentType[] = [];
  let url:
    | string
    | undefined = `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items?$top=5000`;

  try {
    while (url) {
      const res = await fetch(url, {
        headers: { Accept: "application/json;odata=verbose" },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: SharePointResponse = await res.json();
      allPayments.push(...data.d.results); // Add current page results to allPayments
      url = data.d.__next; // Update URL to the next page, if available
    }

    return allPayments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error; // Let react-query handle the error
  }
};

export const useAllPayment = () => {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error
  >({
    queryKey: ["payments"],
    queryFn: fetchAllPayments,
    refetchInterval: 1000, // Refetch every 1 second
    staleTime: 0, // Ensure fresh data due to frequent refetching
  });

  return { isLoading, isError, data: data ?? [], error, refetch, isFetching };
};
