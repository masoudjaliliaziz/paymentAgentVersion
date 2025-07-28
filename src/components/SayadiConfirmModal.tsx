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
    <div className="w-full p-6 flex  justify-center items-center gap-4 rounded-md bg-slate-100">
      <div className="flex flex-col justify-center items-center gap-3">
        {sayadConfirmHoldersArray.map((item) => (
          <div
            className="flex flex-col justify-center items-center gap-2"
            key={item.idCode}
          >
            <div className="flex justify-center items-center gap-3">
              <p>نام صاحب چک</p>
              <span>{item.name}</span>
            </div>

            <div className="flex justify-center items-center gap-3">
              <p> شماره حقیقی / حقوقی</p>
              <span>{item.idCode}</span>
            </div>
          </div>
        ))}
        <button
          className="bg-red-500 px-1.5 py-1 rounded-md cursor-pointer text-white hover:bg-white hover:text-red-600"
          onClick={() => closeModal()}
          type="button"
        >
          بستن
        </button>
      </div>
    </div>
  );
}

export default SayadiConfirmModal;
