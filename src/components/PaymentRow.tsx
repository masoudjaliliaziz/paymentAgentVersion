import { useSelector } from "react-redux";
import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import type { RootState } from "../store/store";
import ActionByRole from "./ActionByRole";
import type { PaymentType } from "../types/apiTypes";
import { useSayadConfirm } from "../hooks/useSayadConfirm";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import SayadiConfirmModal from "./SayadiConfirmModal";
import { getBankNameFromIBAN } from "../utils/getBankNameFromIban";
import { SayadCheckOverlay } from "./SayadCheckOverlay";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentRowProps {
  item: PaymentType;
  parentGuid: string;
  onToggleSelect: () => void;
  isSelected: boolean;
}

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

export const PaymentRow = ({
  item,
  parentGuid,
  onToggleSelect,
  isSelected,
}: PaymentRowProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { userRole } = useSelector((state: RootState) => state.agentFeature);
  const { sayadiCode, dueDate, price, itemGUID, ID } = item;
  const queryClient = useQueryClient();
  const updateSayadVerifiedMutation = useSayadConfirm(parentGuid);

  const [showCheckOverlay, setShowCheckOverlay] = useState(false);
  const [checkBtnColor, setCheckBtnColor] = useState("#0ea5e9");

  function checkSayadConfirm() {
    setCheckBtnColor("#0ea5e9");
    setShowCheckOverlay(true);

    updateSayadVerifiedMutation.mutate(
      { ID },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["payments", parentGuid] });
          setTimeout(() => {
            setShowCheckOverlay(false);
          }, 1500);
        },
        onError: () => {
          setCheckBtnColor("#dc2626");
          setTimeout(() => {
            setShowCheckOverlay(false);
          }, 2000);
        },
      }
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!showDetails ? (
        <motion.div
          key="main"
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 bg-white flex flex-col gap-3"
        >
          <div className="flex justify-between items-center gap-4 rounded-md bg-slate-100 p-1.5">
            <div>
              <p className="font-semibold text-gray-500">استعلام رنگ چک</p>
              <div className="flex gap-1 items-center">
                {Array.from({ length: Number(item.checksColor) }, (_, i) => (
                  <span
                    key={i}
                    className={`rounded-sm w-4 h-4 ${getCheckColor(
                      item.checksColor
                    )}`}
                  ></span>
                ))}
              </div>
            </div>

            <CheckPicConfirm itemGuid={itemGUID} parentGuid={parentGuid} />
            <CheckPic itemGuid={itemGUID} parentGuid={parentGuid} />
            <ActionByRole userRole={userRole} ID={ID} />

            {item.VerifiedSayad === " " ||
            item.VerifiedSayad === null ||
            item.VerifiedSayad === undefined ||
            item.VerifiedSayad === "0" ? (
              <button
                type="button"
                onClick={checkSayadConfirm}
                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md"
              >
                استعلام ثبت چک
              </button>
            ) : (
              <button
                type="button"
                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md"
                onClick={() => setShowDetails(true)}
              >
                نمایش اطلاعات ثبت چک
              </button>
            )}
            <div className="py-3.5 px-1.5 flex justify-end items-center gap-2">
              <div className="font-bold text-sky-500 text-xl ">
                {getBankNameFromIBAN(item.iban)}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-sm font-semibold text-gray-500">شناسه صیادی</p>
              <span className="font-bold text-sky-700 text-sm">
                {sayadiCode}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-500">
                تاریخ سررسید
              </p>
              <span className="font-bold text-sky-700 text-sm">{dueDate}</span>
            </div>

            <div>
              <p className="font-semibold text-gray-500 ">مبلغ</p>
              <div className="flex items-center  gap-1">
                <span>{Number(price).toLocaleString()}</span>
                <span className="font-semibold text-sky-700 text-sm">ریال</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-500">سری</p>
              <span className="font-bold text-sky-700 text-sm">
                {item.seriesNo}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-500">سریال</p>
              <span className="font-bold text-sky-700 text-sm">
                {item.serialNo}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-500">نام کارشناس</p>
              <span className="font-bold text-sky-700 text-sm">
                {item.SalesExpert}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-500">شماره شبا</p>
              <span className="font-bold text-sky-700 text-sm">
                {item.iban}
              </span>
            </div>

            <div>
              <p className="font-semibold text-gray-500">نام صادر کننده</p>
              <span className="font-bold text-sky-700 text-sm">
                {item.name}
              </span>
            </div>
          </div>

          {/* Actions */}

          <SayadCheckOverlay
            isOpen={showCheckOverlay}
            onClose={() => setShowCheckOverlay(false)}
            color={checkBtnColor}
          />
        </motion.div>
      ) : (
        <motion.div
          key="details"
          layout
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="transition-all shadow-md rounded-xl border p-6 mb-6 bg-white"
        >
          <SayadiConfirmModal
            data={item}
            closeModal={() => setShowDetails(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
