// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

// تعریف interface برای پاسخ SharePoint - این interface ساختار پاسخ API را تعریف می‌کند


// تابع fetchPayments برای دریافت پرداخت‌های مربوط به یک GUID خاص
// این تابع مشابه fetchAllPayments عمل می‌کند اما فقط پرداخت‌های مربوط به یک customer را برمی‌گرداند
export async function loadPayment(
  parentGUID: string
): Promise<Partial<PaymentType[]>> {
  const webUrl = "https://crm.zarsim.com";
  const listName = "CustomerPayment";
  let allResults: PaymentType[] = [];
  let nextUrl = `${webUrl}/_api/web/lists/getbytitle('${listName}')/items?$filter=parentGUID eq '${parentGUID}'`;
  try {
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: "GET",
        headers: {
          Accept: "application/json;odata=verbose",
        },
      });

      const data = await response.json();

      // فرض می‌کنیم data.d.results دقیقاً CustomerItem[] هست
      allResults = [...allResults, ...data.d.results];

      nextUrl = data.d.__next || null;
    }

    return allResults;
    console.log("tttttttttttttttttttttttttt", allResults);
  } catch (err) {
    console.error("خطا در دریافت آیتم‌ها:", err);
    return [];
  }
}

// Hook اصلی usePayment - این hook برای دریافت پرداخت‌های یک customer خاص استفاده می‌شود
export const usePayment = (guid: string) => {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error
  >({
    queryKey: ["payments", guid],
    queryFn: async () => {
      const result = await loadPayment(guid);
      // Ensure the result is always of type PaymentType[] (no undefined items)
      return (result ?? []).filter(
        (item): item is PaymentType => typeof item !== "undefined"
      );
    },
    enabled: !!guid, // فقط زمانی که guid موجود باشد، query اجرا شود
    refetchInterval: 1000, // هر 1 ثانیه یکبار داده‌ها را refresh کن
    staleTime: 0, // به دلیل refresh مکرر، همیشه داده‌های تازه را درخواست کن
  });

  // بازگرداندن state های مختلف query به همراه default value برای data
  return { isLoading, isError, data: data ?? [], error, refetch, isFetching };
};
