import { useSelector } from "react-redux";
import CheckPic from "./CheckPic";
import CheckPicConfirm from "./CheckPicConfirm";
import type { RootState } from "../store/store";
import ActionByRole from "./ActionByRole";

interface PaymentRowProps {
  parentGuid: string;
  itemGuid: string;
  seri: string;
  serial: string;
  dueDate: string;
  price: string;
}

export const PaymentRow = ({
  parentGuid,
  itemGuid,
  seri,
  serial,
  dueDate,
  price,
}: PaymentRowProps) => {
  const { userRole } = useSelector((state: RootState) => state.agentFeature);

  return (
    <div className="p-4 bg-white border rounded my-4 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col gap-1">
            {" "}
            <p className="font-bold">سری</p>
            <span>{seri}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold">سریال</p>
            <span>{serial}</span>
          </div>
        </div>
        <p className="font-bold">تاریخ سررسید: {dueDate}</p>
        <div className="flex justify-center items-center gap-1">
          <span className="font-semibold text-xs text-sky-600">ریال</span>
          <p className="font-bold"> مبلغ: {Number(price).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        <CheckPicConfirm itemGuid={itemGuid} parentGuid={parentGuid} />
        <CheckPic itemGuid={itemGuid} parentGuid={parentGuid} />
        <ActionByRole userRole={userRole} />
      </div>
    </div>
  );
};
