import { useSelector } from "react-redux";
import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import type { RootState } from "../store/store";
import ActionByRole from "./ActionByRole";
import type { PaymentType } from "../types/apiTypes";

interface PaymentRowProps {
  item: PaymentType;
  parentGuid: string;
}

export const PaymentRow = ({ item, parentGuid }: PaymentRowProps) => {
  const { userRole } = useSelector((state: RootState) => state.agentFeature);
  const { sayadiCode, dueDate, price, itemGUID, ID } = item;
  return (
    <div className="p-4 bg-white border rounded my-4 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-bold">شناسه صیادی</p>
            <span>{sayadiCode}</span>
          </div>
        </div>
        <p className="font-bold">تاریخ سررسید: {dueDate}</p>
        <div className="flex justify-center items-center gap-1">
          <span className="font-semibold text-xs text-sky-600">ریال</span>
          <p className="font-bold"> مبلغ: {Number(price).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> سری</p>
          <span>{item.seriesNo}</span>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> سریال</p>
          <span>{item.serialNo}</span>
        </div>
      </div>

      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> نام کارشناس</p>
          <span>{item.SalesExpert}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> شماره شبا</p>
          <span>{item.iban}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> نام صادر کننده</p>
          <span>{item.name}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> شعبه بانک</p>
          <span>{item.branchCode}</span>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-bold"> استعلام رنگ چک</p>
          <span>{item.checksColor}</span>
        </div>
      </div>
      <div className="flex justify-end items-center gap-3">
        <CheckPicConfirm itemGuid={itemGUID} parentGuid={parentGuid} />
        <CheckPic itemGuid={itemGUID} parentGuid={parentGuid} />
        <ActionByRole userRole={userRole} ID={ID} />
      </div>
    </div>
  );
};
