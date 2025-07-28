import { useSelector } from "react-redux";
import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import type { RootState } from "../store/store";
import ActionByRole from "./ActionByRole";
import type { PaymentType } from "../types/apiTypes";
import { useSayadConfirm } from "../hooks/useSayadConfirm";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentRowProps {
  item: PaymentType;
  parentGuid: string;
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

export const PaymentRow = ({ item, parentGuid }: PaymentRowProps) => {
  const { userRole } = useSelector((state: RootState) => state.agentFeature);
  const { sayadiCode, dueDate, price, itemGUID, ID } = item;
  const queryClient = useQueryClient();
  const updateSayadVerifiedMutation = useSayadConfirm(parentGuid);
  function checkSayadConfirm() {
    updateSayadVerifiedMutation.mutate(
      {
        ID,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["payments", parentGuid] });
        },
      }
    );
  }

  return (
    <div
      className={`transition-all shadow-md hover:shadow-lg rounded-xl border p-6 mb-6 `}
    >
      {/* Top section */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 items-center mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">شناسه صیادی</p>
          <span className="text-lg font-medium">{sayadiCode}</span>
        </div>
        <p className="text-md font-semibold">تاریخ سررسید: {dueDate}</p>
        <div className="text-end">
          <p className="text-sm font-semibold text-sky-600">ریال</p>
          <p className="text-lg font-bold text-gray-800">
            مبلغ: {Number(price).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="font-semibold text-gray-500">سری</p>
          <span>{item.seriesNo}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-500">سریال</p>
          <span>{item.serialNo}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-500">نام کارشناس</p>
          <span>{item.SalesExpert}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-500">شماره شبا</p>
          <span>{item.iban}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-500">نام صادر کننده</p>
          <span>{item.name}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-500">شعبه بانک</p>
          <span>{item.branchCode}</span>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4">
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

        <div className="flex gap-2">
          <CheckPicConfirm itemGuid={itemGUID} parentGuid={parentGuid} />
          <CheckPic itemGuid={itemGUID} parentGuid={parentGuid} />
          <ActionByRole userRole={userRole} ID={ID} />
          <button type="button" onClick={() => checkSayadConfirm()}>
            استعلام ثبت چک
          </button>
        </div>
      </div>
    </div>
  );
};
