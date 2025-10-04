// src/hooks/useAllPayments.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";
import { useCurrentUser } from "./useUser";

interface SharePointResponse {
  d: {
    results: PaymentType[];
    __next?: string;
  };
}

const fetchAllPayments = async (
  isSpecialUser: boolean = false
): Promise<PaymentType[]> => {
  const allPayments: PaymentType[] = [];

  // All users use the same API endpoint
  let url:
    | string
    | undefined = `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items?$top=5000`;

  try {
    while (url) {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json;odata=verbose",
          // Add additional headers for special users if needed
          ...(isSpecialUser && { "X-RequestDigest": "true" }),
        },
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
  const { data: userData } = useCurrentUser();

  // Check if user is a special user
  const specialUsers = [
    "i:0#.w|zarsim\\rashaadmin",
    "i:0#.w|zarsim\\mesmaeili",
    "i:0#.w|zarsim\\m.esmaeili",
    "i:0#.w|zarsim\\mmoradabadi",
  ];
  const isSpecialUser = userData ? specialUsers.includes(userData) : false;

  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error
  >({
    queryKey: ["payments", isSpecialUser ? "special" : "normal"],
    queryFn: () => fetchAllPayments(isSpecialUser),
    refetchInterval: 1000, // Refetch every 1 second
    staleTime: 0, // Ensure fresh data due to frequent refetching
  });

  return { isLoading, isError, data: data ?? [], error, refetch, isFetching };
};
