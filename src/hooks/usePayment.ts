// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

const fetchPayments = async (guid: string): Promise<PaymentType[]> => {
  console.log("🚀 در حال فچ کردن payment ها برای GUID:", guid);

  const baseUrl = `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items?$filter=parentGUID eq '${guid}'`;
  let allResults: PaymentType[] = [];
  let nextUrl = baseUrl;
  let pageCount = 0;

  try {
    while (nextUrl) {
      pageCount++;
      console.log(`📡 درخواست صفحه ${pageCount}:`, nextUrl);

      const res = await fetch(nextUrl, {
        headers: { Accept: "application/json;odata=verbose" },
      });

      console.log(
        `📊 وضعیت پاسخ صفحه ${pageCount}:`,
        res.status,
        res.statusText
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const pageResults = data.d?.results || [];

      console.log(`📦 داده‌های صفحه ${pageCount}:`, {
        resultsCount: pageResults.length,
        hasResults: !!pageResults,
        firstResult: pageResults[0] || null,
      });

      allResults = [...allResults, ...pageResults];

      // بررسی وجود صفحه بعدی
      nextUrl = data.d?.__next || null;

      if (nextUrl) {
        console.log(`➡️ صفحه بعدی موجود: ${nextUrl}`);
      } else {
        console.log("✅ همه صفحات دریافت شدند");
      }
    }

    console.log("🎉 کل payment های دریافت شده:", {
      totalCount: allResults.length,
      totalPages: pageCount,
      firstPayment: allResults[0] || null,
      lastPayment: allResults[allResults.length - 1] || null,
    });

    return allResults;
  } catch (error) {
    console.error("❌ خطا در دریافت payment ها:", error);
    throw error;
  }
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
