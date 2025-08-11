import { useQuery } from "@tanstack/react-query";
import { loadDebt, type PaymentType } from "../../api/getData";
import type { DebtType } from "../../types/apiTypes";
import { useEffect, useMemo, useState } from "react";
import { calculateRasDateDebt } from "../../utils/calculateRasDate";
import { getShamsiDateFromDayOfYear } from "../../utils/getShamsiDateFromDayOfYear";

// تابع تبدیل اعداد فارسی به انگلیسی
const convertPersianDigitsToEnglish = (str: string): string => {
  return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
};

// تابع محاسبه روز سال امروز
const getTodayShamsiDayOfYear = (): number => {
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const [yearStr, monthStr, dayStr] = formatter
    .format(new Date())
    .split("/")
    .map((part) => convertPersianDigitsToEnglish(part.trim()));
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  console.log(year);
  const daysInMonths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]; // فرض بدون کبیسه
  let dayOfYear = day;
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += daysInMonths[i];
  }
  return dayOfYear;
};

type Props = { parentGUID: string; paymentList: PaymentType[] };

function Debt({ parentGUID, paymentList }: Props) {
  const [totalDebt, setTotalDebt] = useState(0);
  const [dueDateDisplay, setDueDateDisplay] = useState("");

  // پرداختی‌ها

  // بدهی‌ها
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

  // خروجی پس از محاسبه بدهی‌ها با توجه به پرداختی
  const output: (DebtType & { originalDebt: string })[] = useMemo(() => {
    const totalPaid = paymentList.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );
    const sortedDebts = [...debtList]
      .filter((d) => d.debt && d.dayOfYear)
      .sort((a, b) => Number(a.dayOfYear) - Number(b.dayOfYear));

    let remainingPayment = totalPaid;
    const result: (DebtType & { originalDebt: string })[] = [];

    for (const debt of sortedDebts) {
      const currentDebt = Number(debt.debt || 0);

      if (remainingPayment >= currentDebt) {
        remainingPayment -= currentDebt;
        result.push({ ...debt, debt: "0", originalDebt: debt.debt || "0" });
      } else if (remainingPayment > 0) {
        const newDebt = currentDebt - remainingPayment;
        result.push({
          ...debt,
          debt: String(newDebt),
          originalDebt: debt.debt || "0",
        });
        remainingPayment = 0;
      } else {
        result.push({ ...debt, originalDebt: debt.debt || "0" });
      }
    }

    return result;
  }, [paymentList, debtList]);

  // محاسبه تراز و تاریخ سررسید
  const totalOriginalDebt = useMemo(() => {
    return debtList.reduce((sum, item) => sum + Number(item.debt || 0), 0);
  }, [debtList]);

  const totalPaid = useMemo(() => {
    return paymentList.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [paymentList]);

  const remainingBalance = totalPaid - totalOriginalDebt;

  const balanceStatus = remainingBalance >= 0 ? "بستانکار" : "بدهکار";
  const balanceColor =
    remainingBalance >= 0 ? "text-green-600" : "text-red-600";

  // محاسبه اختلاف سررسید با امروز
  const dueDateDayOfYear = calculateRasDateDebt(output);
  const todayDayOfYear = getTodayShamsiDayOfYear();

  // لاگ برای دیباگ
  console.log("todayDayOfYear:", todayDayOfYear);
  console.log("dueDateDayOfYear:", dueDateDayOfYear);

  const dayDifference =
    dueDateDayOfYear !== null && dueDateDayOfYear !== undefined
      ? dueDateDayOfYear - todayDayOfYear
      : null;
  const differenceText =
    dayDifference !== null
      ? dayDifference === 0
        ? "0 روز"
        : dayDifference > 0
        ? `${dayDifference} روز مانده`
        : `${Math.abs(dayDifference)} روز گذشته`
      : "—";

  useEffect(() => {
    const totalDebtCalculated = output.reduce(
      (sum, item) => sum + Number(item.debt || 0),
      0
    );
    const dueDateDisplayCalculated = calculateRasDateDebt(output);

    setTotalDebt(totalDebtCalculated);
    if (
      dueDateDisplayCalculated !== null &&
      dueDateDisplayCalculated !== undefined
    ) {
      setDueDateDisplay(getShamsiDateFromDayOfYear(dueDateDisplayCalculated));
    }
  }, [output]);

  // نمایش بارگذاری یا خطا
  if (isLoadingDebts)
    return <div className="text-center text-lg">در حال بارگذاری...</div>;

  if (isErrorDebts)
    return (
      <div className="text-center text-red-600">خطا: {String(errorDebts)}</div>
    );

  const activeDebts = output.filter((debt) => Number(debt.debt) > 0);

  return (
    <>
      {" "}
      <div className="w-full relative mt-8 px-4 h-dvh">
        <div className="sticky top-0 z-10 bg-base-100 p-4 shadow-md">
          <div className="flex flex-row-reverse gap-14 justify-center items-center px-7 py-4 font-bold text-sm">
            {/* جمع کل بدهی */}
            <div className="flex flex-col gap-1 justify-center items-center">
              <span className="text-primary">جمع کل بدهی</span>
              <div className="flex justify-center items-center gap-2">
                <span className="text-base-content text-xs">ریال</span>
                <span className="text-info">{totalDebt.toLocaleString()}</span>
              </div>
            </div>

            {/* تاریخ سررسید */}
            <div className="flex flex-col gap-1 justify-center items-center">
              <span className="text-primary"> راس بدهی</span>
              <div className="flex justify-center items-center gap-2">
                <span className="text-info">{dueDateDisplay || "نامشخص"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 justify-center items-center">
              <span className="text-primary"> اختلاف با امروز</span>
              <div className="flex justify-center items-center gap-2">
                <div className="text-info ">({differenceText})</div>
              </div>
            </div>

            {/* تراز مالی */}
            <div className="flex flex-col gap-1 justify-center items-center">
              <span className="text-primary">تراز مالی</span>
              <div className="flex justify-center items-center gap-2">
                <span className={balanceColor}>
                  {Math.abs(remainingBalance).toLocaleString()}
                </span>
              </div>
            </div>

            <span className={`font-bold ${balanceColor}`}>{balanceStatus}</span>
          </div>
        </div>
        <div className="max-h-[calc(100vh-100px)] overflow-y-auto py-3">
          {/* بدهی‌های فعال */}
          <div className="space-y-2">
            {activeDebts.map((debt, index) => (
              <div
                key={index}
                className={`grid grid-cols-5 p-3 rounded-md shadow-md w-full items-center justify-center ${
                  index % 2 === 0 ? "bg-base-300" : "bg-base-100"
                }`}
              >
                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    جمع کل
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {Number(debt.originalDebt).toLocaleString() || "نامشخص"}
                  </span>
                </div>

                <div className="flex flex-row-reverse items-center gap-1.5">
                  <span className="font-semibold text-sm text-primary">
                    باقی‌مانده
                  </span>
                  <span className="font-semibold text-sm text-base-content">
                    {Number(debt.debt).toLocaleString() || "نامشخص"}
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

                <div className="flex justify-center items-center gap-1.5">
                  <span className="text-red-600 font-bold text-xs">
                    پرداخت نشده
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
        </div>
      </div>
    </>
  );
}

export default Debt;
