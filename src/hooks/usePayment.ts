// src/hooks/usePayment.ts
import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../types/apiTypes";

// تعریف interface برای پاسخ SharePoint - این interface ساختار پاسخ API را تعریف می‌کند
interface SharePointResponse {
  d: {
    results: PaymentType[];
    __next?: string;
  };
}

// تابع fetchPayments برای دریافت پرداخت‌های مربوط به یک GUID خاص
// این تابع مشابه fetchAllPayments عمل می‌کند اما فقط پرداخت‌های مربوط به یک customer را برمی‌گرداند
const fetchPayments = async (guid: string): Promise<PaymentType[]> => {
  try {
    const res = await fetch(
      `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items?$filter=parentGUID eq '${guid}'`,
      { headers: { Accept: "application/json;odata=verbose" } }
    );

    // بررسی وضعیت HTTP response - اگر خطا باشد، exception پرتاب می‌شود
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data: SharePointResponse = await res.json();
    return data.d.results;
  } catch (error) {
    // در صورت بروز خطا، آن را در console نمایش داده و دوباره پرتاب می‌کنیم
    // تا react-query بتواند آن را مدیریت کند
    console.error("Error fetching payments:", error);
    throw error; // Let react-query handle the error
  }
};

// Hook اصلی usePayment - این hook برای دریافت پرداخت‌های یک customer خاص استفاده می‌شود
export const usePayment = (guid: string) => {
  const { isLoading, isError, data, error, refetch, isFetching } = useQuery<
    PaymentType[],
    Error
  >({
    queryKey: ["payments", guid],
    queryFn: () => fetchPayments(guid),
    enabled: !!guid, // فقط زمانی که guid موجود باشد، query اجرا شود
    refetchInterval: 1000, // هر 1 ثانیه یکبار داده‌ها را refresh کن
    staleTime: 0, // به دلیل refresh مکرر، همیشه داده‌های تازه را درخواست کن
  });

  // بازگرداندن state های مختلف query به همراه default value برای data
  return { isLoading, isError, data: data ?? [], error, refetch, isFetching };
};
