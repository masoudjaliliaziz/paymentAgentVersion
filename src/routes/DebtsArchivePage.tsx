import { useQuery } from "@tanstack/react-query";
import { useParentGuid } from "../hooks/useParentGuid";
import { loadDebt } from "../api/getData";
import { useMemo } from "react";
import type { DebtType, PaymentType } from "../types/apiTypes";
import {
  calculateRasDateDebt,
  calculateRasDatePayment,
} from "../utils/calculateRasDate";
import { getShamsiDateFromDayOfYear } from "../utils/getShamsiDateFromDayOfYear";

type Props = {
  paymentList: PaymentType[];
};

function DebtsArchivePage({ paymentList }: Props) {
  const parentGUID = useParentGuid();

  const {
    data: debtList = [],
    isLoading: isLoadingDebts,
    isError: isErrorDebts,
    error: errorDebts,
  } = useQuery<DebtType[]>({
    queryKey: ["Debt", parentGUID],
    queryFn: async () => {
      const data = await loadDebt(parentGUID);
      return (data as (DebtType | undefined)[]).filter(
        (item): item is DebtType => item !== undefined
      );
    },
    enabled: !!parentGUID,
    refetchInterval: 5000,
  });

  // بدهی‌هایی که با پرداخت‌ها تسویه شدند
  const settledDebts = useMemo(() => {
    const totalPaid = paymentList.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const sortedDebts = [...debtList]
      .filter((d) => d.debt && d.dayOfYear)
      .sort((a, b) => Number(a.dayOfYear) - Number(b.dayOfYear));

    let remainingPayment = totalPaid;

    return sortedDebts.reduce<(DebtType & { originalDebt: string })[]>(
      (acc, debt) => {
        const currentDebt = Number(debt.debt || 0);
        const originalDebt = debt.debt || "0";

        if (remainingPayment >= currentDebt) {
          remainingPayment -= currentDebt;
          acc.push({ ...debt, originalDebt });
        }

        return acc;
      },
      []
    );
  }, [debtList, paymentList]);

  const totalSettledDebt = useMemo(() => {
    return settledDebts.reduce(
      (sum, debt) => sum + Number(debt.originalDebt || 0),
      0
    );
  }, [settledDebts]);

  // داده‌های مورد نیاز برای محاسبه راس بدهی تسویه شده
  const settledDebtsForRas = useMemo(() => {
    return settledDebts.map((d) => ({
      ...d,
      debt: d.originalDebt, // تضمین اینکه تابع Ras مبلغ اصلی رو بگیره
    }));
  }, [settledDebts]);

  // محاسبه روز راس برای بدهی‌های تسویه شده
  const dueDateDisplayCalculated = useMemo(() => {
    if (settledDebtsForRas.length > 0) {
      return calculateRasDateDebt(settledDebtsForRas);
    }
    return null;
  }, [settledDebtsForRas]);

  // تاریخ شمس از روز سال راس بدهی تسویه شده
  const dueDateDisplay = dueDateDisplayCalculated
    ? getShamsiDateFromDayOfYear(dueDateDisplayCalculated)
    : "";

  // محاسبه روز راس برای کل بدهی‌ها
  const rasDayOfYearAllPaymnets = calculateRasDatePayment(paymentList);

  // محاسبه اختلاف روز با علامت مثبت یا منفی
  const dayDifference =
    rasDayOfYearAllPaymnets !== null && dueDateDisplayCalculated !== null
      ? rasDayOfYearAllPaymnets - dueDateDisplayCalculated
      : null;

  const differenceText =
    dayDifference !== null
      ? dayDifference === 0
        ? "0 روز"
        : dayDifference > 0
        ? `${dayDifference} روز مانده`
        : `${Math.abs(dayDifference)} روز گذشته`
      : "—";

  if (!parentGUID) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        در حال بارگذاری اطلاعات فرم...
      </div>
    );
  }

  if (isLoadingDebts)
    return <div className="text-center text-lg">در حال بارگذاری...</div>;

  if (isErrorDebts)
    return (
      <div className="text-center text-red-600">خطا: {String(errorDebts)}</div>
    );

  return (
    <div className="w-full mt-8 px-4 relative">
      {settledDebts.length > 0 ? (
        <>
          {/* جمع کل بدهی‌های تسویه شده */}
          <div className="text-center rounded-md flex flex-col justify-center items-center gap-3 mb-8 w-3/8 mx-auto p-6 shadow-sm">
            <span className="font-bold text-lg">جمع کل بدهی‌های آرشیو شده</span>
            <div className="flex flex-row-reverse justify-center items-center gap-3">
              <span className="font-bold text-green-700 text-xl">
                {totalSettledDebt.toLocaleString("fa-IR")}
              </span>
              <span className="font-bold text-lg text-sky-500">ریال</span>
            </div>
          </div>

          {/* راس بدهی‌های تسویه شده */}
          <div className="text-center rounded-md flex flex-col justify-center items-center gap-3 mb-8 w-3/8 mx-auto p-6 shadow-sm">
            <span className="font-bold text-lg">راس بدهی‌های آرشیو شده</span>
            <div className="flex flex-row-reverse justify-center items-center gap-3">
              <span className="font-bold text-green-700 text-xl">
                {dueDateDisplay || "محاسبه نشد"}
              </span>
            </div>
          </div>

          {/* اختلاف روز */}
          <div className="text-center mb-8">
            <span className="text-sm font-semibold text-gray-700">
              اختلاف با راس کل بدهی‌ها: {differenceText}
            </span>
          </div>

          {/* لیست بدهی‌های تسویه شده */}
          <div className="flex flex-col gap-4">
            {settledDebts.map((debt, index) => (
              <div
                key={index}
                className="grid grid-cols-5 p-3 rounded-md shadow-sm bg-green-50 items-center"
              >
                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    جمع کل
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {Number(debt.originalDebt).toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    باقی‌مانده
                  </span>
                  <span className="font-semibold text-sm text-green-600">
                    0
                  </span>
                </div>

                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    شماره فاکتور
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {debt.orderNum}
                  </span>
                </div>

                <div className="flex justify-center items-center">
                  <span className="text-green-600 font-bold text-xs">
                    تسویه شده
                  </span>
                </div>

                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    تاریخ ایجاد فاکتور
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {debt.debtDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500">
          هیچ بدهی تسویه‌شده‌ای وجود ندارد.
        </div>
      )}
    </div>
  );
}

export default DebtsArchivePage;
