import { useState, useEffect } from "react";
import type { PaymentType } from "../types/apiTypes";

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

function convertChequeStatusToMessage(code: string): string {
  return chequeStatusMap[code] ?? "وضعیت نامشخص";
}

function convertBlockStatusToMessage(code: string): string {
  return blockStatusMap[code] ?? "وضعیت نامشخص";
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
    <div className="w-full p-6 flex  justify-center items-center gap-4 rounded-md ">
      <div className="flex flex-col justify-center items-center gap-3">
        {sayadConfirmHoldersArray.map((item) => (
          <div
            className="flex flex-col justify-center items-center gap-2"
            key={item.idCode}
          >
            <div className="flex flex-col justify-center items-center gap-3">
              <p>نام صاحب چک</p>
              <span>{item.name}</span>
            </div>

            <div className="flex flex-col justify-center items-center gap-3">
              <p> شماره حقیقی / حقوقی</p>
              <span>{item.idCode}</span>
            </div>
          </div>
        ))}
        <div>
          {data.sayadConfirmReason &&
            convertSayadConfirmReasonToMessage(data.sayadConfirmReason)}
        </div>

        <div>
          {data.sayadConfirmBlockStatus &&
            convertBlockStatusToMessage(data.sayadConfirmBlockStatus)}
        </div>
        <div>
          {data.sayadConfirmChequeStatus &&
            convertChequeStatusToMessage(data.sayadConfirmChequeStatus)}
        </div>
        <div>{data.sayadConfirmChequeType}</div>
        <div>{data.sayadConfirmGuaranteeStatus}</div>
        <button
          className="bg-sky-500 px-1.5 py-1 rounded-md cursor-pointer text-white hover:bg-white hover:text-sky-500"
          onClick={() => closeModal()}
          type="button"
        >
          بازگشن به چک
        </button>
      </div>
    </div>
  );
}

export default SayadiConfirmModal;
