import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import ActionByRole from "./ActionByRole";
import type { PaymentType } from "../types/apiTypes";
import { useSayadConfirm } from "../hooks/useSayadConfirm";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getBankNameFromIBAN } from "../utils/getBankNameFromIban";
import { motion, AnimatePresence } from "framer-motion";

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

import { formatShamsiDate } from "../utils/formatShamsiDate";
import { useSayadConfirmTr } from "../hooks/useSayadConfirmTr";
import { useRejectSayadConfirmTr } from "../hooks/useSayadRejectTr";

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
  parentGuid: string;
  onToggleSelect: () => void;
  isSelected: boolean;
  isVerifyingAll: boolean;
  verifyAllIds: string[];
  onVerificationComplete: (id: string, error?: string) => void;
}

export function PaymentRowTr({
  item,
  parentGuid,
  onToggleSelect,
  isSelected,
  isVerifyingAll,
  verifyAllIds,
  onVerificationComplete,
}: PaymentRowProps) {
  const [sayadConfirmHoldersArray, setSayadConfirmHoldersArray] = useState<
    SayadHolders[]
  >([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: mutateConfirmTr } = useSayadConfirmTr(parentGuid);
  const { mutate: mutateRejectTr } = useRejectSayadConfirmTr(parentGuid);
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
                error
              );
              setErrorMessage(errorMsg);
              setIsVerifying(false);
              onVerificationComplete(String(ID), errorMsg);
            },
            // جدید: onSettled برای مطمئن شدن از پایان (حتی اگر retry باشه)
            onSettled: () => {
              setIsVerifying(false); // همیشه در پایان false کن
            },
          }
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
      }
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
                error
              );
              setErrorMessage(errorMsg);
              setIsVerifying(false);
              onVerificationComplete(String(ID), errorMsg);
            },
          }
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
            <div className="flex justify-between items-center gap-4 rounded-md bg-slate-100 p-1.5">
              <div>
                <p className="font-semibold text-gray-500">استعلام رنگ چک</p>
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

              {itemGUID && parentGuid && (
                <>
                  <CheckPicConfirm
                    itemGuid={itemGUID}
                    parentGuid={parentGuid}
                  />
                  <CheckPic itemGuid={itemGUID} parentGuid={parentGuid} />
                </>
              )}

              <ActionByRole ID={ID} />

              <button
                type="button"
                onClick={checkSayadConfirm}
                disabled={isVerifyingAll || isVerifying}
                className={`px-4 py-2 rounded-md text-white font-semibold ${
                  isVerifyingAll || isVerifying
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-sky-500 hover:bg-sky-600"
                }`}
              >
                {isVerifyingAll || isVerifying
                  ? "در حال استعلام..."
                  : "استعلام ثبت چک"}
              </button>

              {String(item.VerifiedSayad) === "2" && (
                <button
                  disabled
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                >
                  چک به نام زرسیم ثبت نشده است
                </button>
              )}

              <div className="py-3.5 px-1.5 flex justify-end items-center gap-2">
                <div className="font-bold text-sky-500 text-xl">
                  {item.iban ? getBankNameFromIBAN(item.iban) : "نامشخص"}
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={onToggleSelect}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

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
                          {Number(item.sayadConfirmAmount ?? 0).toLocaleString(
                            "fa-IR"
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
                    {item.sayadConfirmAcceptStatusCode !== "" &&
                      item.sayadConfirmAcceptStatusCode !== undefined &&
                      item.sayadConfirmAcceptStatusCode !== null && (
                        <div
                          className={`rounded-md font-bold text-lg flex justify-center items-center ${
                            item.sayadConfirmAcceptStatusCode === "FAILED"
                              ? "border-4 border-red-800 text-red-800"
                              : item.sayadConfirmAcceptStatusCode === "DONE"
                              ? "border-4 border-green-800 text-green-800"
                              : ""
                          } `}
                        >
                          {item.sayadConfirmAcceptStatusCode === "FAILED"
                            ? "  چک صیادی رد شده است"
                            : item.sayadConfirmAcceptStatusCode === "DONE"
                            ? "چک صیادی تایید شده است"
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
            <div className="flex justify-end items-center gap-4 rounded-md bg-slate-100 p-1.5 px-3">
              {itemGUID && parentGuid && (
                <CheckPicConfirm
                  title="دانلود فیش واریزی"
                  itemGuid={itemGUID}
                  parentGuid={parentGuid}
                />
              )}

              {status && (
                <span
                  className={`font-bold text-xs ${
                    status === "1"
                      ? "text-green-700"
                      : status === "2"
                      ? "text-red-700"
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
              <ActionByRole ID={ID} />

              <p className="font-bold text-sky-500 text-lg">واریز نقدی</p>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 cursor-pointer"
              />
            </div>

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
    </>
  );
}
