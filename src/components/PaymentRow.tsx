import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import ActionByRole from "./ActionByRole";
import type { PaymentType } from "../types/apiTypes";
import { useSayadConfirm } from "../hooks/useSayadConfirm";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useUpdateInvoiceType } from "../hooks/useUpdateInvoiceType";
type SayadHolders = {
  idCode: string;
  idType: number;
  name: string;
};
const invoiceTypeOptions = [
  { value: "1", label: "نوع ۱" },
  { value: "2", label: "نوع ۲" },
  { value: "3", label: "دانش‌بنیان" },
];

const getPaymentStage = (status: string) => {
  switch (status) {
    case "0":
      return "در انتظار تایید کارشناس";
    case "1":
      return "در انتظار تایید خزانه";
    case "2":
      return "رد شده توسط کارشناس";
    case "3":
      return "رد شده توسط خزانه";
    case "4":
      return "تایید نهایی";
    default:
      return "وضعیت نامشخص";
  }
};

const getPaymentStageColor = (status: string) => {
  switch (status) {
    case "0":
      return "bg-yellow-100 text-yellow-800";
    case "1":
      return "bg-blue-100 text-blue-800";
    case "2":
      return "bg-red-100 text-red-800";
    case "3":
      return "bg-red-100 text-red-800";
    case "4":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const reasonMap: Record<string, string> = {
  POSA: "واریز حقوق",
  IOSP: "امور بیمه خدمات",
  HIPA: "امور درمانی",
  ISAP: "امور سرمایه گذاری و بورس",
  FXAP: "امور ارزی در چارچوب ضوابط و مقررات",
  DRPA: "پرداخت قرض و تادیه دیون",
  RTAP: "امور بازنشستگی",
  MPTP: "معاملات اموال منقول",
  IMPT: "معاملات اموال غیر منقول",
  LMAP: "مدیریت نقدینگی",
  CDAP: "عوارض گمرکی",
  TCAP: "تسویه مالیاتی",
  GEAC: "سایر خدمات دولتی",
  LRPA: "تسهیلات و تعهدات",
  CCPA: "تودیع وثیقه",
  GPAC: "هزینه عمومی و امور روزمره",
  CPAC: "کمک‌های خیریه",
  GPPC: "خرید کالا",
  SPAC: "خرید خدمات",
};

const chequeStatusMap: Record<string, string> = {
  "1": "صادر شده",
  "2": "نقد شده",
  "3": "باطل شده",
  "4": "برگشت خورده",
  "5": "بخشی برگشت خورده",
  "6": "در انتظار امضای ضامن",
  "7": "در انتظار تایید گیرنده در کشیدن چک",
  "8": "در انتظار تایید گیرنده در انتقال چک",
};

const blockStatusMap: Record<string, string> = {
  "0": "چک مسدود نشده است",
  "1": "مسدود موقت می‌باشد",
  "2": "مسدود دائم می‌باشد",
  "3": "چک رفع مسدودی شده است",
};

const chequeTypeStatusMap: Record<string, string> = {
  "0": "عادی",
  "1": "بانکی (چک تضمینی)",
  "2": "رمزدار",
  "3": "چک موردی",
};

const guaranteeStatusMap: Record<string, string> = {
  "0": "این چک فاقد ضمانت می‌باشد",
  "1": "فرآیند ضمانت در جریان است",
  "2": "فرآیند ضمانت ناتمام خاتمه یافته است",
  "3": "فرآیند ضمانت اتمام و همه ضامن‌ها ضمانت کرده‌اند",
  "4": "فرآیند ضمانت اتمام و برخی ضامن‌ها ضمانت را رد کرده‌اند",
};

function convertSayadConfirmReasonToMessage(code: string): string {
  return reasonMap[code] ?? "نامشخص";
}

function convertChequeStatusToMessage(code: string): string {
  return chequeStatusMap[code] ?? "وضعیت نامشخص";
}

function convertBlockStatusToMessage(code: string): string {
  return blockStatusMap[code] ?? "وضعیت نامشخص";
}

function ChequeTypeStatusToMessage(code: string): string {
  return chequeTypeStatusMap[code] ?? "وضعیت نامشخص";
}

function guaranteeStatusToMessage(code: string): string {
  return guaranteeStatusMap[code] ?? "وضعیت نامشخص";
}

import { formatShamsiDate } from "../utils/formatShamsiDate";

const normalizeDate = (date: string | undefined | null): string | null => {
  if (!date || typeof date !== "string") {
    console.warn("normalizeDate: تاریخ نامعتبر یا وجود ندارد", date);
    return null;
  }

  const persianToEnglishDigits = (str: string) =>
    str.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728));

  const normalized = persianToEnglishDigits(date).replace(/[^0-9]/g, "");

  if (/^\d{8}$/.test(normalized)) {
    return normalized;
  }

  console.warn("normalizeDate: فرمت تاریخ نامعتبر است", date, normalized);
  return null;
};

// const getCheckColor = (colorCode: string | undefined) => {
//   const colorMap: Record<string, string> = {
//     "1": "bg-gray-100",
//     "2": "bg-yellow-300",
//     "3": "bg-orange-300",
//     "4": "bg-amber-800",
//     "5": "bg-red-400",
//   };
//   return colorMap[colorCode ?? ""] ?? "bg-gray-500 border border-gray-700";
// };

interface PaymentRowProps {
  item: PaymentType;
  parentGuid: string;
  onToggleSelect: () => void;
  isSelected: boolean;
  isVerifyingAll: boolean;
  verifyAllIds: string[];
  onVerificationComplete: (id: string, error?: string) => void;
}

export const PaymentRow = ({
  item,
  parentGuid,
  onToggleSelect,
  isSelected,
  isVerifyingAll,
  verifyAllIds,
  onVerificationComplete,
}: PaymentRowProps) => {
  const updateInvoiceTypeMutation = useUpdateInvoiceType(parentGuid);
  const [sayadConfirmHoldersArray, setSayadConfirmHoldersArray] = useState<
    SayadHolders[]
  >([]);
  const [manualInvoiceType, setManualInvoiceType] = useState<string>("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sayadiCode, dueDate, price, itemGUID, ID, status } = item;
  const queryClient = useQueryClient();
  const updateSayadVerifiedMutation = useSayadConfirm(parentGuid);

  const normalizedPrice = item.price
    ? String(Number(String(item.price).replace(/[^0-9]/g, "")))
    : null;
  const normalizedSayadAmount = item.sayadConfirmAmount
    ? String(Number(String(item.sayadConfirmAmount).replace(/[^0-9]/g, "")))
    : null;

  const normalizedDueDate = normalizeDate(item.dueDate);
  const normalizedSayadDueDate = normalizeDate(item.sayadConfirmDueDate);
  const isPriceAndDateMatch =
    normalizedPrice &&
    normalizedSayadAmount &&
    normalizedPrice === normalizedSayadAmount &&
    normalizedDueDate &&
    normalizedSayadDueDate &&
    normalizedDueDate === normalizedSayadDueDate;
  useEffect(() => {
    if (verifyAllIds.includes(String(ID)) && !item.Error && !isVerifying) {
      console.log(`دیباگ: شروع استعلام گروهی برای ID ${ID}`);
      setIsVerifying(true);
      setErrorMessage(null);

      const index = verifyAllIds.indexOf(String(ID));
      const timeoutId = setTimeout(() => {
        // تغییر: timeoutId برای clear
        console.log(`دیباگ: ارسال درخواست برای ID ${ID}`);
        updateSayadVerifiedMutation.mutate(
          { ID: Number(ID) },
          {
            onSuccess: () => {
              console.log(`دیباگ: استعلام گروهی برای ID ${ID} موفق بود`);
              queryClient.invalidateQueries({
                queryKey: ["payments", parentGuid],
              });
              setIsVerifying(false);
              onVerificationComplete(String(ID));
            },
            onError: (error) => {
              const errorMsg = error.message || "خطا در استعلام گروهی";
              console.error(
                `دیباگ: خطا در استعلام گروهی برای ID ${ID}:`,
                error,
              );
              setErrorMessage(errorMsg);
              setIsVerifying(false);
              onVerificationComplete(String(ID), errorMsg);
            },
            // جدید: onSettled برای مطمئن شدن از پایان (حتی اگر retry باشه)
            onSettled: () => {
              setIsVerifying(false); // همیشه در پایان false کن
            },
          },
        );
      }, index * 200);

      // جدید: fallback timeout برای جلوگیری از گیر کردن ابدی
      const fallbackTimeout = setTimeout(() => {
        if (isVerifying) {
          setIsVerifying(false);
          setErrorMessage("Timeout: استعلام بیش از حد طول کشید");
        }
      }, 10000); // ۱۰ ثانیه

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(fallbackTimeout);
      };
    }
  }, [
    verifyAllIds,
    ID,
    item.Error,
    parentGuid,
    queryClient,
    updateSayadVerifiedMutation,
    onVerificationComplete,
    isVerifying,
  ]);

  function checkSayadConfirm() {
    console.log(`دیباگ: شروع استعلام تکی برای ID ${ID}`);
    setIsVerifying(true);
    setErrorMessage(null);

    updateSayadVerifiedMutation.mutate(
      { ID: Number(ID) },
      {
        onSuccess: () => {
          console.log(`دیباگ: استعلام تکی برای ID ${ID} موفق بود`);
          queryClient.invalidateQueries({ queryKey: ["payments", parentGuid] });
          setIsVerifying(false);
        },
        onError: (error) => {
          const errorMsg = error.message || "خطا در استعلام";
          console.error(`دیباگ: خطا در استعلام تکی برای ID ${ID}:`, error);
          setErrorMessage(errorMsg);
          setIsVerifying(false);
        },
        // جدید: onSettled برای پایان مطمئن
        onSettled: () => {
          setIsVerifying(false);
        },
      },
    );

    // جدید: fallback timeout برای تکی
    setTimeout(() => {
      if (isVerifying) {
        setIsVerifying(false);
        setErrorMessage("Timeout: استعلام بیش از حد طول کشید");
      }
    }, 10000);
  }
  useEffect(() => {
    if (item.sayadConfirmHolders) {
      try {
        const parsed = JSON.parse(item.sayadConfirmHolders);
        if (Array.isArray(parsed)) {
          setSayadConfirmHoldersArray(parsed);
        }
      } catch (error) {
        console.error("فرمت داده‌ی sayadConfirmHolders نامعتبر است", error);
      }
    }
  }, [item.sayadConfirmHolders]);

  useEffect(() => {
    if (verifyAllIds.includes(String(ID)) && !item.Error && !isVerifying) {
      console.log(`دیباگ: شروع استعلام گروهی برای ID ${ID}`);
      setIsVerifying(true);
      setErrorMessage(null);

      const index = verifyAllIds.indexOf(String(ID));
      const timeout = setTimeout(() => {
        console.log(`دیباگ: ارسال درخواست برای ID ${ID}`);
        updateSayadVerifiedMutation.mutate(
          { ID: Number(ID) },
          {
            onSuccess: () => {
              console.log(`دیباگ: استعلام گروهی برای ID ${ID} موفق بود`);
              queryClient.invalidateQueries({
                queryKey: ["payments", parentGuid],
              });
              setIsVerifying(false);
              onVerificationComplete(String(ID));
            },
            onError: (error) => {
              const errorMsg = error.message || "خطا در استعلام گروهی";
              console.error(
                `دیباگ: خطا در استعلام گروهی برای ID ${ID}:`,
                error,
              );
              setErrorMessage(errorMsg);
              setIsVerifying(false);
              onVerificationComplete(String(ID), errorMsg);
            },
          },
        );
      }, index * 200);

      return () => clearTimeout(timeout);
    }
  }, [
    verifyAllIds,
    ID,
    item.Error,
    parentGuid,
    queryClient,
    updateSayadVerifiedMutation,
    onVerificationComplete,
    isVerifying,
  ]);
  function handleUpdateInvoiceType() {
    if (!manualInvoiceType) return;

    updateInvoiceTypeMutation.mutate(
      {
        ID: Number(ID),
        invoiceType: manualInvoiceType as "1" | "2" | "3",
      },
      {
        onSuccess: () => {
          setManualInvoiceType("");
        },
      },
    );
  }

  return (
    <>
      {item.cash === "0" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="main"
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-6"
          >
            <div
              className="
    flex
    flex-row-reverse
    flex-wrap
    items-center
    justify-start
    gap-2
    rounded-xl
    bg-slate-100
    p-2
    px-3
    sm:gap-3
  "
            >
              {/* ===================================================== */}
              {/* عنوان چک + انتخاب */}
              {/* ===================================================== */}

              <div
                className="
      flex
      shrink-0
      items-center
      justify-center
      gap-2
      rounded-lg
      bg-white
      px-3
      py-2
      shadow-sm
    "
              >
                <span className="m-0 text-xs font-bold text-sky-500 sm:text-base">
                  چک
                </span>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelect}
                  className="
        h-4
        w-4
        cursor-pointer
        accent-sky-500
      "
                />
              </div>

              {/* ===================================================== */}
              {/* نوع فاکتور */}
              {/* ===================================================== */}

              {item.invoiceType && (
                <span
                  className={`
        inline-flex
        min-h-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        px-3
        py-2
        text-xs
        font-bold
        text-white
        whitespace-nowrap

        ${
          String(item.invoiceType) === "1"
            ? "bg-blue-500"
            : String(item.invoiceType) === "2"
              ? "bg-purple-500"
              : String(item.invoiceType) === "3"
                ? "bg-green-500"
                : "bg-gray-500"
        }
      `}
                >
                  {String(item.invoiceType) === "1" && "نوع ۱"}
                  {String(item.invoiceType) === "2" && "نوع ۲"}
                  {String(item.invoiceType) === "3" && "دانش بنیان"}
                  {String(item.invoiceType) === "4" && "نامشخص"}
                </span>
              )}

              {/* علت واریز نقدی */}
              {/* ===================================================== */}

              {item.cashResean && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          String(item.cashResean) === "buyGoods"
            ? "bg-blue-500 text-white"
            : "bg-orange-500 text-white"
        }
      `}
                >
                  {item.cashResean === "buyGoods" && "بابت خرید کالا"}

                  {item.cashResean === "checkFori" && "بابت چک برگشتی"}
                </span>
              )}
              {/* ===================================================== */}
              {/* تصویر چک */}
              {/* ===================================================== */}

              {itemGUID && parentGuid && (
                <div className="shrink-0">
                  <CheckPic itemGuid={itemGUID} parentGuid={parentGuid} />
                </div>
              )}

              {/* ===================================================== */}
              {/* وضعیت پرداخت */}
              {/* ===================================================== */}

              {item.status === "0" && (
                <div className="shrink-0">
                  <ActionByRole ID={ID} />
                </div>
              )}

              {/* ===================================================== */}
              {/* وضعیت استعلام */}
              {/* ===================================================== */}

              {item.status === "0" ? (
                <button
                  type="button"
                  onClick={checkSayadConfirm}
                  disabled={isVerifyingAll || isVerifying}
                  className="
        min-h-9
        shrink-0
        rounded-lg
        bg-sky-500
        px-4
        py-2
        text-xs
        font-semibold
        text-white
        transition
        hover:bg-sky-600
        disabled:cursor-not-allowed
        disabled:bg-gray-400
        sm:text-sm
      "
                >
                  {isVerifyingAll || isVerifying
                    ? "در حال استعلام..."
                    : "استعلام ثبت چک"}
                </button>
              ) : (
                <div
                  className={`
        flex
        min-h-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        px-3
        py-2
        text-xs
        font-semibold
        text-center
        whitespace-nowrap
        sm:text-sm
        ${getPaymentStageColor(item.status)}
      `}
                >
                  {getPaymentStage(item.status)}
                </div>
              )}

              {/* ===================================================== */}
              {/* عدم ثبت چک به نام زرسیم */}
              {/* ===================================================== */}

              {String(item.VerifiedSayad) === "2" && (
                <div
                  className="
        flex
        min-h-9
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        border-red-200
        bg-red-50
        px-3
        py-2
        text-center
        text-xs
        font-bold
        text-red-600
        whitespace-nowrap
      "
                >
                  چک به نام زرسیم ثبت نشده است
                </div>
              )}

              {/* ===================================================== */}
              {/* تعیین نوع فاکتور */}
              {/* ===================================================== */}

              {String(item.invoiceType) === "4" ||
                (String(item.new) === "1" && (
                  <div
                    className="
        flex
        w-full
        shrink-0
        flex-col
        gap-2
        rounded-lg
        bg-white
        p-2
        shadow-sm

        sm:w-auto
        sm:flex-row
        sm:items-center
      "
                  >
                    <select
                      value={manualInvoiceType}
                      onChange={(e) => setManualInvoiceType(e.target.value)}
                      className="
          min-h-9
          w-full
          min-w-0
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-1.5
          text-sm
          text-slate-700
          outline-none
          transition
          focus:border-sky-500
          focus:ring-2
          focus:ring-sky-100

          sm:w-48
        "
                    >
                      <option value="">انتخاب نوع فاکتور</option>

                      {invoiceTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!manualInvoiceType}
                      onClick={handleUpdateInvoiceType}
                      className="
          min-h-9
          shrink-0
          rounded-lg
          bg-emerald-500
          px-4
          py-1.5
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-emerald-600
          disabled:cursor-not-allowed
          disabled:bg-gray-400
          disabled:hover:bg-gray-400
        "
                    >
                      ثبت
                    </button>
                  </div>
                ))}
            </div>
            {item?.treasuryConfirmDescription !== "" &&
              item?.treasuryConfirmDescription !== null &&
              item?.treasuryConfirmDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات خزانه داری</span>
                  <span>{item.treasuryConfirmDescription}</span>
                </div>
              )}
            {item?.distDescription !== "" &&
              item?.distDescription !== null &&
              item?.distDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات مشتری</span>
                  <span>{item.distDescription}</span>
                </div>
              )}
            {errorMessage && (
              <div className="flex justify-end">
                <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                  {errorMessage}
                </span>
              </div>
            )}
            {String(item.VerifiedSayad) === "1" && !item.Error && (
              <div className="flex justify-end">
                {isPriceAndDateMatch ? (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                    مبلغ و تاریخ تطابق دارند
                  </span>
                ) : (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                    مبلغ یا تاریخ تطابق ندارند
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-500">شناسه صیادی</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {sayadiCode ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">تاریخ سررسید</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {dueDate ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">مبلغ</p>
                  <div className="flex items-center gap-1">
                    <span>{Number(price ?? 0).toLocaleString()}</span>
                    <span className="font-semibold text-sky-700 text-sm">
                      ریال
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">سری</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {item.seriesNo ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">سریال</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {item.serialNo ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">نام کارشناس</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {item.SalesExpert ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">شماره شبا</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {item.iban ?? "نامشخص"}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-500">نام صادر کننده</p>
                  <span className="font-bold text-sky-700 text-sm">
                    {item.name ?? "نامشخص"}
                  </span>
                </div>
              </div>

              {String(item.VerifiedSayad) === "1" &&
              !item.Error &&
              !errorMessage ? (
                <div className="border-t pt-4 mt-4">
                  <span className="text-lg font-semibold text-gray-700 mb-4 flex w-full justify-center items-center">
                    اطلاعات استعلام صیاد
                  </span>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {sayadConfirmHoldersArray.map((holder, index) => (
                      <>
                        <div key={index}>
                          <div>
                            <p className="font-semibold text-gray-600">
                              نام صاحب چک
                            </p>
                            <span className="font-bold text-sky-700">
                              {holder.name}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-600">
                            شماره حقیقی/حقوقی
                          </p>
                          <span className="font-bold text-sky-700">
                            {holder.idCode}
                          </span>
                        </div>
                      </>
                    ))}
                    <div>
                      <p className="font-semibold text-gray-600">
                        علت ثبت چک صیاد
                      </p>
                      <span className="font-bold text-sky-700">
                        {item.sayadConfirmReason
                          ? convertSayadConfirmReasonToMessage(
                              item.sayadConfirmReason,
                            )
                          : "درج نشده"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">
                        وضعیت مسدودی چک
                      </p>
                      <span className="font-bold text-sky-700">
                        {item.sayadConfirmBlockStatus
                          ? convertBlockStatusToMessage(
                              item.sayadConfirmBlockStatus,
                            )
                          : "نامشخص"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">وضعیت چک</p>
                      <span className="font-bold text-sky-700">
                        {item.sayadConfirmChequeStatus
                          ? convertChequeStatusToMessage(
                              item.sayadConfirmChequeStatus,
                            )
                          : "نامشخص"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">نوع چک</p>
                      <span className="font-bold text-sky-700">
                        {item.sayadConfirmChequeType
                          ? ChequeTypeStatusToMessage(
                              item.sayadConfirmChequeType,
                            )
                          : "نامشخص"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">
                        وضعیت ضمانت چک
                      </p>
                      <span className="font-bold text-sky-700">
                        {item.sayadConfirmGuaranteeStatus
                          ? guaranteeStatusToMessage(
                              item.sayadConfirmGuaranteeStatus,
                            )
                          : "نامشخص"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">
                        مبلغ ثبت‌شده
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-bold ${
                            normalizedPrice === normalizedSayadAmount
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {Number(item.sayadConfirmAmount ?? 0).toLocaleString(
                            "fa-IR",
                          )}
                        </span>
                        <span className="font-bold text-xs text-gray-600">
                          ریال
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">
                        تاریخ ثبت‌شده
                      </p>
                      <span
                        className={`font-bold ${
                          normalizedDueDate === normalizedSayadDueDate
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatShamsiDate(String(item.sayadConfirmDueDate)) ??
                          "درج نشده"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                (item.VerifiedSayad || errorMessage || item.Error) && (
                  <div className="border-t pt-4 mt-4">
                    <span className="text-lg font-semibold text-red-700 mb-4 flex w-full justify-center items-center">
                      ناموفق در استعلام
                    </span>
                    {errorMessage && (
                      <p className="text-red-600 text-center">{errorMessage}</p>
                    )}
                    {item.Error && (
                      <p className="text-red-600 text-center">
                        خطا: {item.Error}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {item.cash === "1" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="main"
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-3"
          >
            <div
              className="
    flex
    flex-wrap
    flex-row-reverse
    items-center
    justify-start
    gap-2
    rounded-xl
    bg-slate-100
    p-2
    px-3
    sm:gap-3
  "
            >
              {/* ===================================================== */}
              {/* عنوان و انتخاب */}
              {/* ===================================================== */}

              <div
                className="
      flex
      shrink-0
      items-center
      justify-center
      gap-2
      rounded-lg
      bg-white
      px-3
      py-2
      shadow-sm
    "
              >
                <span className="m-0 text-xs font-bold text-sky-500 sm:text-base">
                  واریز نقدی
                </span>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelect}
                  className="
        h-4
        w-4
        cursor-pointer
        accent-sky-500
      "
                />
              </div>

              {/* ===================================================== */}
              {/* نوع فاکتور */}
              {/* ===================================================== */}

              {item.invoiceType && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          String(item.invoiceType) === "1"
            ? "bg-blue-500 text-white"
            : String(item.invoiceType) === "2"
              ? "bg-purple-500 text-white"
              : String(item.invoiceType) === "3"
                ? "bg-green-500 text-white"
                : "bg-gray-500 text-white"
        }
      `}
                >
                  {String(item.invoiceType) === "1" && "نوع ۱"}
                  {String(item.invoiceType) === "2" && "نوع ۲"}
                  {String(item.invoiceType) === "3" && "دانش بنیان"}
                  {String(item.invoiceType) === "4" && "نامشخص"}
                </span>
              )}

              {/* علت واریز نقدی */}
              {/* ===================================================== */}

              {item.cashResean && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          String(item.cashResean) === "buyGoods"
            ? "bg-blue-500 text-white"
            : "bg-orange-500 text-white"
        }
      `}
                >
                  {item.cashResean === "buyGoods" && "بابت خرید کالا"}

                  {item.cashResean === "checkFori" && "بابت چک برگشتی"}
                </span>
              )}
              {/* ===================================================== */}
              {/* شماره چک برگشتی */}
              {/* ===================================================== */}

              {item.cashResean === "checkFori" &&
                item.selectedCheckSayadiForCheckFori && (
                  <span
                    className="
          inline-flex
          min-h-8
          max-w-full
          items-center
          justify-center
          rounded-lg
          bg-orange-500
          px-3
          py-1.5
          text-xs
          font-bold
          text-white
          break-all
        "
                  >
                    {item.selectedCheckSayadiForCheckFori}
                  </span>
                )}

              {/* ===================================================== */}
              {/* دانلود فیش */}
              {/* ===================================================== */}

              {itemGUID && parentGuid && (
                <div className="shrink-0">
                  <CheckPicConfirm
                    title="دانلود فیش واریزی"
                    itemGuid={itemGUID}
                    parentGuid={parentGuid}
                  />
                </div>
              )}

              {/* ===================================================== */}
              {/* وضعیت کارشناس */}
              {/* ===================================================== */}

              {status && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          status === "1"
            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
            : status === "2"
              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
              : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
        }
      `}
                >
                  {status === "1"
                    ? "تایید توسط کارشناس"
                    : status === "2"
                      ? "رد شده توسط کارشناس"
                      : ""}
                </span>
              )}

              {/* ===================================================== */}
              {/* عملیات نقش */}
              {/* ===================================================== */}

              {item.status === "0" && (
                <div className="shrink-0">
                  <ActionByRole ID={ID} />
                </div>
              )}

              {/* ===================================================== */}

              {/* ===================================================== */}
              {/* تعیین نوع فاکتور در حالت نامشخص */}
              {/* ===================================================== */}

              {String(item.invoiceType) === "4" ||
                (String(item.new) === "1" && (
                  <div
                    className="
        flex
        w-full
        flex-col
        gap-2
        rounded-lg
        bg-white
        p-2
        shadow-sm
        sm:w-auto
        sm:flex-row
        sm:items-center
      "
                  >
                    <select
                      value={manualInvoiceType}
                      onChange={(e) => setManualInvoiceType(e.target.value)}
                      className="
          min-h-9
          w-full
          min-w-0
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-1.5
          text-sm
          text-slate-700
          outline-none
          transition

          focus:border-sky-500
          focus:ring-2
          focus:ring-sky-100

          sm:w-48
        "
                    >
                      <option value="">انتخاب نوع فاکتور</option>

                      {invoiceTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!manualInvoiceType}
                      onClick={handleUpdateInvoiceType}
                      className="
          min-h-9
          shrink-0
          rounded-lg
          bg-emerald-500
          px-4
          py-1.5
          text-sm
          font-semibold
          text-white
          transition

          hover:bg-emerald-600

          disabled:cursor-not-allowed
          disabled:bg-gray-400
          disabled:hover:bg-gray-400
        "
                    >
                      ثبت
                    </button>
                  </div>
                ))}
            </div>

            {item?.treasuryConfirmDescription !== "" &&
              item?.treasuryConfirmDescription !== null &&
              item?.treasuryConfirmDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات خزانه داری</span>
                  <span>{item.treasuryConfirmDescription}</span>
                </div>
              )}
            {item?.distDescription !== "" &&
              item?.distDescription !== null &&
              item?.distDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات مشتری</span>
                  <span>{item.distDescription}</span>
                </div>
              )}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  تاریخ واریز
                </p>
                <span className="font-bold text-sky-700 text-sm">
                  {dueDate ?? "نامشخص"}
                </span>
              </div>

              <div>
                <p className="font-semibold text-gray-500">مبلغ</p>
                <div className="flex items-center gap-1">
                  <span>{Number(price ?? 0).toLocaleString("fa-IR")}</span>
                  <span className="font-semibold text-sky-700 text-sm">
                    ریال
                  </span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-500">نام کارشناس</p>
                <span className="font-bold text-sky-700 text-sm">
                  {item.SalesExpert ?? "نامشخص"}
                </span>
              </div>

              <div>
                <p className="font-semibold text-gray-500">نام بانک مقصد</p>
                <span className="font-bold text-sky-700 text-sm">
                  {item.bankName ?? "نامشخص"}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {item.cash === "2" && (
        <AnimatePresence mode="wait">
          <motion.div
            key="main"
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-3"
          >
            <div
              className="
    flex
    flex-wrap
    flex-row-reverse
    items-center
    justify-start
    gap-2
    rounded-xl
    bg-slate-100
    p-2
    px-3
    sm:gap-3
  "
            >
              {/* ===================================================== */}
              {/* عنوان و انتخاب */}
              {/* ===================================================== */}

              <div
                className="
      flex
      shrink-0
      items-center
      justify-center
      gap-2
      rounded-lg
      bg-white
      px-3
      py-2
      shadow-sm
    "
              >
                <span className="m-0 text-xs font-bold text-sky-500 sm:text-base">
                  کارتخوان
                </span>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelect}
                  className="
        h-4
        w-4
        cursor-pointer
        accent-sky-500
      "
                />
              </div>

              {/* ===================================================== */}
              {/* نوع فاکتور */}
              {/* ===================================================== */}

              {item.invoiceType && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          String(item.invoiceType) === "1"
            ? "bg-blue-500 text-white"
            : String(item.invoiceType) === "2"
              ? "bg-purple-500 text-white"
              : String(item.invoiceType) === "3"
                ? "bg-green-500 text-white"
                : String(item.invoiceType) === "5"
                  ? "bg-teal-700 text-white"
                  : "bg-gray-500 text-white"
        }
      `}
                >
                  {String(item.invoiceType) === "1" && "نوع ۱"}
                  {String(item.invoiceType) === "2" && "نوع ۲"}
                  {String(item.invoiceType) === "3" && "دانش بنیان"}
                  {String(item.invoiceType) === "5" && " نوع ۳"}
                  {String(item.invoiceType) === "4" && "نامشخص"}
                </span>
              )}

              {/* علت واریز نقدی */}
              {/* ===================================================== */}

              {item.cashResean && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          String(item.cashResean) === "buyGoods"
            ? "bg-blue-500 text-white"
            : "bg-orange-500 text-white"
        }
      `}
                >
                  {item.cashResean === "buyGoods" && "بابت خرید کالا"}

                  {item.cashResean === "checkFori" && "بابت چک برگشتی"}
                </span>
              )}
              {/* ===================================================== */}
              {/* شماره چک برگشتی */}
              {/* ===================================================== */}

              {item.cashResean === "checkFori" &&
                item.selectedCheckSayadiForCheckFori && (
                  <span
                    className="
          inline-flex
          min-h-8
          max-w-full
          items-center
          justify-center
          rounded-lg
          bg-orange-500
          px-3
          py-1.5
          text-xs
          font-bold
          text-white
          break-all
        "
                  >
                    {item.selectedCheckSayadiForCheckFori}
                  </span>
                )}

              {/* ===================================================== */}
              {/* دانلود فیش */}
              {/* ===================================================== */}

              {itemGUID && parentGuid && (
                <div className="shrink-0">
                  <CheckPicConfirm
                    title="دانلود فیش واریزی"
                    itemGuid={itemGUID}
                    parentGuid={parentGuid}
                  />
                </div>
              )}

              {/* ===================================================== */}
              {/* وضعیت کارشناس */}
              {/* ===================================================== */}

              {status && (
                <span
                  className={`
        inline-flex
        min-h-8
        items-center
        justify-center
        rounded-lg
        px-3
        py-1.5
        text-xs
        font-bold
        whitespace-nowrap

        ${
          status === "1"
            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
            : status === "2"
              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
              : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
        }
      `}
                >
                  {status === "1"
                    ? "تایید توسط کارشناس"
                    : status === "2"
                      ? "رد شده توسط کارشناس"
                      : ""}
                </span>
              )}

              {/* ===================================================== */}
              {/* عملیات نقش */}
              {/* ===================================================== */}

              {item.status === "0" && (
                <div className="shrink-0">
                  <ActionByRole ID={ID} />
                </div>
              )}

              {/* ===================================================== */}

              {/* ===================================================== */}
              {/* تعیین نوع فاکتور در حالت نامشخص */}
              {String(item.invoiceType) === "4" ||
                (String(item.new) === "1" && (
                  <div
                    className="
        flex
        w-full
        flex-col
        gap-2
        rounded-lg
        bg-white
        p-2
        shadow-sm
        sm:w-auto
        sm:flex-row
        sm:items-center
      "
                  >
                    <select
                      value={manualInvoiceType}
                      onChange={(e) => setManualInvoiceType(e.target.value)}
                      className="
          min-h-9
          w-full
          min-w-0
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-1.5
          text-sm
          text-slate-700
          outline-none
          transition

          focus:border-sky-500
          focus:ring-2
          focus:ring-sky-100

          sm:w-48
        "
                    >
                      <option value="">انتخاب نوع فاکتور</option>

                      {invoiceTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!manualInvoiceType}
                      onClick={handleUpdateInvoiceType}
                      className="
          min-h-9
          shrink-0
          rounded-lg
          bg-emerald-500
          px-4
          py-1.5
          text-sm
          font-semibold
          text-white
          transition

          hover:bg-emerald-600

          disabled:cursor-not-allowed
          disabled:bg-gray-400
          disabled:hover:bg-gray-400
        "
                    >
                      ثبت
                    </button>
                  </div>
                ))}
              {/* ===================================================== */}
            </div>

            {item?.treasuryConfirmDescription !== "" &&
              item?.treasuryConfirmDescription !== null &&
              item?.treasuryConfirmDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات خزانه داری</span>
                  <span>{item.treasuryConfirmDescription}</span>
                </div>
              )}
            {item?.distDescription !== "" &&
              item?.distDescription !== null &&
              item?.distDescription !== undefined && (
                <div className="bg-slate-100 font-bold w-full py-3 px-3 flex  gap-3 justify-start items-center rounded-lg text-gray-600 flex-row-reverse">
                  <span className="text-emerald-700">توضیحات مشتری</span>
                  <span>{item.distDescription}</span>
                </div>
              )}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  تاریخ واریز
                </p>
                <span className="font-bold text-sky-700 text-sm">
                  {dueDate ?? "نامشخص"}
                </span>
              </div>

              <div>
                <p className="font-semibold text-gray-500">مبلغ</p>
                <div className="flex items-center gap-1">
                  <span>{Number(price ?? 0).toLocaleString("fa-IR")}</span>
                  <span className="font-semibold text-sky-700 text-sm">
                    ریال
                  </span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-500">نام کارشناس</p>
                <span className="font-bold text-sky-700 text-sm">
                  {item.SalesExpert ?? "نامشخص"}
                </span>
              </div>

              <div>
                <p className="font-semibold text-gray-500"> شماره پایانه </p>
                <span className="font-bold text-sky-700 text-sm">
                  {item.pozExternal}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};
