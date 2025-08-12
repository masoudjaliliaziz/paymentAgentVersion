import { useState, useEffect } from "react";
import type { PaymentType } from "../types/apiTypes";
import { Undo2 } from "lucide-react";
import { formatShamsiDate } from "../utils/formatShamsiDate";
type Props = {
  data: Partial<PaymentType>;
  closeModal: () => void;
};

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

function convertSayadConfirmReasonToMessage(code: string): string {
  return reasonMap[code] ?? "نامشخص";
}

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
  "0": "  چک مسدود نشده است",
  "1": "  مسدود موقت می‌باشد",
  "2": "  مسدود دائم می‌باشد",
  "3": "  چک رفع مسدودی شده است",
};

const chequeTypeStatusMap: Record<string, string> = {
  "0": "عادی",
  "1": " بانکی (چک تضمینی)",
  "2": "رمزدار",
  "3": " چک موردی",
};

const guaranteeStatusMap: Record<string, string> = {
  "0": " این چک فاقد ضمانت می باشد",
  "1": " فرآیند ضمانت در جریان است",
  "2": " فرآیند ضمانت ناتمام خاتمه یافته است",
  "3": " فرآیند ضمانت اتمام و همه ضامن ها ضمانت کرده اند",
  "4": " فرآیند ضمانت اتمام و برخی ضامن ها ضمانت را رد کرده اند",
};

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
function SayadiConfirmModal({ data, closeModal }: Props) {
  const [sayadConfirmHoldersArray, setSayadConfirmHoldersArray] = useState<
    SayadHolders[]
  >([]);

  useEffect(() => {
    if (data.sayadConfirmHolders) {
      try {
        const parsed = JSON.parse(data.sayadConfirmHolders);
        if (Array.isArray(parsed)) {
          setSayadConfirmHoldersArray(parsed);
        }
      } catch (error) {
        console.error("فرمت داده‌ی sayadConfirmHolders نامعتبر است", error);
      }
    }
  }, [data.sayadConfirmHolders]);

  return (
    <div className="w-full p-6 flex flex-col   gap-4 rounded-md  ">
      <button
        className="bg-sky-500 px-1.5 py-1 flex gap-1 items-center justify-end rounded-md cursor-pointer text-white hover:bg-white hover:text-sky-500"
        onClick={() => closeModal()}
        type="button"
      >
        بازگشن به چک
        <Undo2 />
      </button>
      <div className="grid grid-cols-4 gap-4 mb-4 ">
        {sayadConfirmHoldersArray.map((item) => (
          <>
            <div>
              <p className="font-semibold text-gray-600"> نام صاحب چک </p>
              <span className="font-bold text-sky-700">{item.name}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-600">
                شماره حقیقی / حقوقی{" "}
              </p>
              <span className="font-bold text-sky-700">{item.idCode}</span>
            </div>
          </>
        ))}
        <div>
          <p className="font-semibold text-gray-600">علت ثبت چک صیاد</p>
          <span className="font-bold text-sky-700">
            {data.sayadConfirmReason &&
            data.sayadConfirmReason !== null &&
            data.sayadConfirmReason !== undefined &&
            data.sayadConfirmReason !== ""
              ? convertSayadConfirmReasonToMessage(data.sayadConfirmReason)
              : "درج نشده"}
          </span>
        </div>

        <div>
          <p className="font-semibold text-gray-600"> وضعیت مسدودی چک</p>
          <span className="font-bold text-sky-700">
            {data.sayadConfirmBlockStatus &&
              convertBlockStatusToMessage(data.sayadConfirmBlockStatus)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-gray-600"> وضعیت چک</p>
          <span className="font-bold text-sky-700">
            {data.sayadConfirmChequeStatus &&
              convertChequeStatusToMessage(data.sayadConfirmChequeStatus)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-gray-600">نوع چک </p>
          <span className="font-bold text-sky-700">
            {data.sayadConfirmChequeType &&
              ChequeTypeStatusToMessage(data.sayadConfirmChequeType)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-gray-600">وضعیت ضمانت چک </p>
          <span className="font-bold text-sky-700">
            {data.sayadConfirmGuaranteeStatus &&
              guaranteeStatusToMessage(data.sayadConfirmGuaranteeStatus)}
          </span>
        </div>

        <div>
          <p className="font-semibold text-gray-600"> مبلغ ثبت شده </p>
          <div className="flex flex-row-reverse gap-3 items-center justify-end">
            <span
              className={`font-bold ${
                data.sayadConfirmAmount === data.price
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {Number(data.sayadConfirmAmount).toLocaleString("fa-IR") ??
                "درج نشده"}
            </span>
            <span className="font-bold text-xs text-gray-600">ریال</span>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-600"> تاریخ ثبت شده </p>
          <span className={`font-bold text-sky-700`}>
            {formatShamsiDate(String(data.sayadConfirmDueDate)) ?? "درج نشده"}
          </span>
        </div>

        <div className="font-semibold bg-green-700 text-white rounded-md flex justify-center items-center hover:bg-white hover:text-green-700 cursorointer">
          تایید چک صیاد{" "}
        </div>

        <div className="font-semibold bg-red-700 text-white rounded-md flex justify-center items-center hover:bg-white hover:text-red-700 cursorointer">
          {" "}
          عدم تایید چک صیاد
        </div>
      </div>
    </div>
  );
}

export default SayadiConfirmModal;
