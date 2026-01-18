import CheckPic from "./../CheckPic";
import CheckPicConfirm from "./../CheckPicConfirm";

import type { PaymentType } from "../../types/apiTypes";
import { useSayadConfirm } from "../../hooks/useSayadConfirm";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { getBankNameFromIBAN } from "../../utils/getBankNameFromIban";
import { motion, AnimatePresence } from "framer-motion";
import { formatShamsiDate } from "../../utils/formatShamsiDate";
import { useSayadConfirmTr } from "../../hooks/useSayadConfirmTr";
import { useRejectSayadConfirmTr } from "../../hooks/useSayadRejectTr";
import { useCustomers } from "../../hooks/useCustomer";
import { useClearPaymentError } from "./../../hooks/useClearPaymentError";

import { Trash2 } from "lucide-react";
type SayadHolders = {
  idCode: string;
  idType: number;
  name: string;
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

// تعیین متن و رنگ badge وضعیت کلی هر ردیف بر اساس status
function getStatusBadge(status: string | undefined | null): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case "0":
      return {
        label: "در انتظار تایید کارشناس",
        colorClass: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      };
    case "1":
      return {
        label: "در انتظار تایید خزانه",
        colorClass: "bg-blue-100 text-blue-800 border border-blue-300",
      };
    case "2":
      return {
        label: "رد شده توسط کارشناس",
        colorClass: "bg-red-100 text-red-800 border border-red-300",
      };
    case "3":
      return {
        label: "رد شده توسط خزانه",
        colorClass: "bg-red-100 text-red-800 border border-red-300",
      };
    case "4":
      return {
        label: "تایید نهایی",
        colorClass: "bg-green-100 text-green-800 border border-green-300",
      };
    default:
      return {
        label: "وضعیت نامشخص",
        colorClass: "bg-gray-100 text-gray-700 border border-gray-300",
      };
  }
}

const normalizeDate = (date: string | undefined | null): string | null => {
  if (!date || typeof date !== "string") {
    return null;
  }

  const persianToEnglishDigits = (str: string) =>
    str.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728));

  const normalized = persianToEnglishDigits(date).replace(/[^0-9]/g, "");

  if (/^\d{8}$/.test(normalized)) {
    return normalized;
  }

  // اگر طول بیشتر از 8 بود، 8 رقم اول را بگیر
  if (normalized.length >= 8) {
    return normalized.slice(0, 8);
  }

  return null;
};

const formatCreatedDate = (created?: string | null): string => {
  if (!created) return "ثبت نامشخص";

  // ابتدا تلاش برای تبدیل به شمسی با تاریخ و ساعت
  const parsed = new Date(created);
  if (!isNaN(parsed.getTime())) {
    try {
      const dateObj = new DateObject({
        date: parsed,
        calendar: persian,
        locale: persian_fa,
      });
      return dateObj.format("YYYY/MM/DD HH:mm");
    } catch (error) {
      console.warn("خطا در فرمت تاریخ ثبت:", error);
    }
  }

  // fallback به نرمالایز و فرمت قبلی
  const normalized = normalizeDate(created);
  if (normalized) return formatShamsiDate(normalized);

  return "ثبت نامشخص";
};

const getCheckColor = (colorCode: string | undefined) => {
  const colorMap: Record<string, string> = {
    "1": "bg-gray-100",
    "2": "bg-yellow-300",
    "3": "bg-orange-300",
    "4": "bg-amber-800",
    "5": "bg-red-400",
  };
  return colorMap[colorCode ?? ""] ?? "bg-gray-500 border border-gray-700";
};

interface PaymentRowProps {
  item: PaymentType;
  onToggleSelect: () => void;
  isSelected: boolean;
  isVerifyingAll: boolean;
  verifyAllIds: string[];
  index: number;
  onVerificationComplete: (id: string, error?: string) => void;
  onUpdateTitle?: (parentGUID: string, title: string) => void; // پراپ جدید
  onUpdateCustomerCode?: (parentGUID: string, code: string) => void; // پراپ جدید برای CustomerCode
}

export function PaymentRowMorad({
  item,
  index,
  onToggleSelect,
  isSelected,

  verifyAllIds,
  onVerificationComplete,
  onUpdateTitle, // اضافه کردن پراپ جدید
}: PaymentRowProps) {
  const [sayadConfirmHoldersArray, setSayadConfirmHoldersArray] = useState<
    SayadHolders[]
  >([]);
  const { mutate: clearError } = useClearPaymentError(item.parentGUID);
  const [isVerifying, setIsVerifying] = useState(false);
  const { data, isLoading: isLoadinCustomer } = useCustomers(item.parentGUID);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: mutateConfirmTr } = useSayadConfirmTr(item.parentGUID);
  const { mutate: mutateRejectTr } = useRejectSayadConfirmTr(item.parentGUID);

  const { sayadiCode, dueDate, price, itemGUID, ID, status } = item;
  const queryClient = useQueryClient();
  const updateSayadVerifiedMutation = useSayadConfirm(item.parentGUID);
  const createdDateLabel = formatCreatedDate(item.Created);

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

  // اضافه کردن useEffect برای ارسال Title به App
  useEffect(() => {
    if (data?.[0]?.Title && onUpdateTitle) {
      onUpdateTitle(item.parentGUID, data[0].Title);
    }
  }, [data, item.parentGUID, onUpdateTitle]);

  useEffect(() => {
    if (verifyAllIds.includes(String(ID)) && !item.Error && !isVerifying) {
      console.log(`دیباگ: شروع استعلام گروهی برای ID ${ID}`);
      setIsVerifying(true);
      setErrorMessage(null);

      const index = verifyAllIds.indexOf(String(ID));
      const timeoutId = setTimeout(() => {
        console.log(`دیباگ: ارسال درخواست برای ID ${ID}`);
        updateSayadVerifiedMutation.mutate(
          { ID: Number(ID) },
          {
            onSuccess: () => {
              console.log(`دیباگ: استعلام گروهی برای ID ${ID} موفق بود`);
              queryClient.invalidateQueries({
                queryKey: ["payments", item.parentGUID],
              });
              setIsVerifying(false);
              onVerificationComplete(String(ID));
            },
            onError: (error) => {
              const errorMsg = error.message || "خطا در استعلام گروهی";
              console.error(
                `دیباگ: خطا در استعلام گروهی برای ID ${ID}:`,
                error
              );
              setErrorMessage(errorMsg);
              setIsVerifying(false);
              onVerificationComplete(String(ID), errorMsg);
            },
            onSettled: () => {
              setIsVerifying(false);
            },
          }
        );
      }, index * 200);

      const fallbackTimeout = setTimeout(() => {
        if (isVerifying) {
          setIsVerifying(false);
          setErrorMessage("Timeout: استعلام بیش از حد طول کشید");
        }
      }, 10000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(fallbackTimeout);
      };
    }
  }, [
    verifyAllIds,
    ID,
    item.Error,
    item.parentGUID,
    queryClient,
    updateSayadVerifiedMutation,
    onVerificationComplete,
    isVerifying,
  ]);

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

  if (isLoadinCustomer) {
    return <span className="spin-in-6 ">در حال بارگیری</span>;
  }

  return (
    <div className="flex flex-row-reverse justify-between items-center gap-1">
      <div className="w-1/12 h-full p-1 justify-center items-center flex">
        <div className="font-black text-xl min-w-8 aspect-square flex items-center justify-center rounded-full bg-black text-white ">
          {(index + 1).toLocaleString("fa-IR")}
        </div>
      </div>
      <div className="w-11/12 h-full">
        {item.cash === "0" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="main"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-6"
            >
              {/* Badge وضعیت کلی ردیف بر اساس status */}
              {status && (
                <span
                  className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
                    getStatusBadge(status).colorClass
                  }`}
                >
                  {getStatusBadge(status).label}
                </span>
              )}
              {item.Created && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm bg-slate-100 text-slate-700 border border-slate-300">
                  ثبت: {createdDateLabel}
                </span>
              )}
              {item.Created && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm bg-slate-100 text-slate-700 border border-slate-300">
                  ثبت: {createdDateLabel}
                </span>
              )}

              <table className="w-full rounded-lg bg-slate-100 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-semibold text-gray-600 text-sm">
                          استعلام رنگ چک
                        </p>
                        <div className="flex gap-1 items-center">
                          {Array.from(
                            { length: Number(item.checksColor ?? 0) || 0 },
                            (_, i) => (
                              <span
                                key={i}
                                className={`rounded-sm w-4 h-4 ${getCheckColor(
                                  item.checksColor
                                )}`}
                              ></span>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-2">
                        {itemGUID && item.parentGUID && (
                          <>
                            <CheckPic
                              itemGuid={itemGUID}
                              parentGuid={item.parentGUID}
                            />
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="font-bold text-sky-500 text-lg">
                        {item.iban ? getBankNameFromIBAN(item.iban) : "نامشخص"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-sm font-bold text-white bg-slate-800 text-center rounded-lg px-3 py-2 whitespace-nowrap">
                          {data?.[0]?.Title ?? "در حال بارگذاری..."}
                        </span>
                        {item.invoiceType && (
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md w-16 text-center ${
                              String(item.invoiceType) === "1"
                                ? "bg-blue-500 text-white"
                                : String(item.invoiceType) === "2"
                                ? "bg-purple-500 text-white"
                                : String(item.invoiceType) === "3"
                                ? "bg-green-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {item.invoiceType === "1" && "نوع ۱"}
                            {item.invoiceType === "2" && "نوع ۲"}
                            {item.invoiceType === "3" && "دانش بنیان"}
                            {item.invoiceType === "4" && "نامشخص"}
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={onToggleSelect}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </td>
                  </tr>
                  {String(item.VerifiedSayad) === "2" && (
                    <tr>
                      <td colSpan={5} className="p-3 text-center">
                        <button
                          disabled
                          type="button"
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap"
                        >
                          چک به نام زرسیم ثبت نشده است
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

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
                      {Number(price?.replaceAll(",", "") ?? 0).toLocaleString(
                        "fa-IR"
                      )}
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
                    <p className="font-semibold text-gray-500">
                      نام صادر کننده
                    </p>
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
                    {!item.sayadConfirmAcceptStatusCode && (
                      <div className="flex justify-start items-center gap-3">
                        <div
                          onClick={() => mutateConfirmTr(ID)}
                          className="font-semibold bg-green-700 text-white rounded-md flex justify-center items-center hover:bg-white hover:text-green-700 cursor-pointer h-6 px-1.5 py-1 "
                        >
                          تایید چک صیاد
                        </div>

                        <div
                          onClick={() => mutateRejectTr(ID)}
                          className="font-semibold bg-red-700 text-white rounded-md flex justify-center items-center hover:bg-white hover:text-red-700 cursor-pointer h-6 px-1.5 py-1 "
                        >
                          {" "}
                          عدم تایید چک صیاد
                        </div>
                      </div>
                    )}
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
                                item.sayadConfirmReason
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
                                item.sayadConfirmBlockStatus
                              )
                            : "نامشخص"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-600">وضعیت چک</p>
                        <span className="font-bold text-sky-700">
                          {item.sayadConfirmChequeStatus
                            ? convertChequeStatusToMessage(
                                item.sayadConfirmChequeStatus
                              )
                            : "نامشخص"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-600">نوع چک</p>
                        <span className="font-bold text-sky-700">
                          {item.sayadConfirmChequeType
                            ? ChequeTypeStatusToMessage(
                                item.sayadConfirmChequeType
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
                                item.sayadConfirmGuaranteeStatus
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
                            {Number(
                              item.sayadConfirmAmount ?? 0
                            ).toLocaleString("fa-IR")}
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
                      {item.sayadConfirmAcceptStatusCode !== "" &&
                        item.sayadConfirmAcceptStatusCode !== undefined &&
                        item.sayadConfirmAcceptStatusCode !== null && (
                          <div
                            className={`rounded-md font-bold text-lg flex justify-center items-center ${
                              item.sayadConfirmAcceptStatusCode === "FAILED"
                                ? "border-4 border-red-800 text-red-800"
                                : item.sayadConfirmAcceptStatusCode ===
                                    "DONE" &&
                                  item.sayadConfirmAcceptStatusMessage ===
                                    "تایید چک با موفقیت انجام شد"
                                ? "border-4 border-green-800 text-green-800"
                                : item.sayadConfirmAcceptStatusCode === "DONE"
                                ? "border-4 border-orange-400 text-orange-400"
                                : ""
                            } `}
                          >
                            {item.sayadConfirmAcceptStatusCode === "FAILED"
                              ? item.sayadConfirmAcceptStatusMessage
                              : item.sayadConfirmAcceptStatusCode === "DONE"
                              ? item.sayadConfirmAcceptStatusMessage
                              : ""}
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  (item.VerifiedSayad || errorMessage || item.Error) && (
                    <div className="border-t pt-4 mt-4">
                      <span className="text-lg font-semibold text-red-700 mb-4 flex w-full justify-center items-center">
                        ناموفق در استعلام
                      </span>
                      {errorMessage && (
                        <p className="text-red-600 text-center">
                          {errorMessage}
                        </p>
                      )}
                      {item.Error && (
                        <p className="text-red-600 text-center">
                          خطا: {item.Error}
                        </p>
                      )}
                      {item.Error && (
                        <div
                          onClick={() => clearError(Number(ID))}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          <Trash2 width={20} height={20} />
                        </div>
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
              className="relative transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-3"
            >
              {/* Badge وضعیت کلی ردیف بر اساس status */}
              {status && (
                <span
                  className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${
                    getStatusBadge(status).colorClass
                  }`}
                >
                  {getStatusBadge(status).label}
                </span>
              )}

              <table className="w-full rounded-lg bg-slate-100 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-semibold text-gray-600 text-sm">
                          نوع پرداخت
                        </p>
                        <p className="font-bold text-sky-500 text-lg">
                          واریز نقدی
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-2">
                        {itemGUID && item.parentGUID && (
                          <CheckPicConfirm
                            title="دانلود فیش واریزی"
                            itemGuid={itemGUID}
                            parentGuid={item.parentGUID}
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="flex items-center justify-center">
                        {status && (
                          <span
                            className={`font-bold text-sm px-3 py-1 rounded-md ${
                              status === "1"
                                ? "text-green-700 bg-green-100"
                                : status === "2"
                                ? "text-red-700 bg-red-100"
                                : ""
                            }`}
                          >
                            {status === "1"
                              ? "تایید توسط کارشناس"
                              : status === "2"
                              ? "رد شده توسط کارشناس"
                              : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200">
                      <div className="font-bold text-sky-500 text-lg">
                        {item.bankName ?? "نامشخص"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-sm font-bold text-white bg-slate-800 text-center rounded-lg px-3 py-2 whitespace-nowrap">
                          {data?.[0]?.Title ?? "در حال بارگذاری..."}
                        </span>
                        {item.invoiceType && (
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md w-16 text-center ${
                              String(item.invoiceType) === "1"
                                ? "bg-blue-500 text-white"
                                : String(item.invoiceType) === "2"
                                ? "bg-purple-500 text-white"
                                : String(item.invoiceType) === "3"
                                ? "bg-green-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {item.invoiceType === "1" && "نوع ۱"}
                            {item.invoiceType === "2" && "نوع ۲"}
                            {item.invoiceType === "3" && "دانش بنیان"}
                            {item.invoiceType === "4" && "نامشخص"}
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={onToggleSelect}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

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
                    <span>
                      {Number(price?.replaceAll(",", "") ?? 0).toLocaleString(
                        "fa-IR"
                      )}
                    </span>
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
      </div>
    </div>
  );
}
