import Debt from "../components/debt/Debt";

import { useParentGuid } from "../hooks/useParentGuid";
import type { PaymentType } from "../types/apiTypes";
type Props = {
  paymentList: PaymentType[];
};
export default function DebtsPage({ paymentList }: Props) {
  const guid = useParentGuid();

  return (
    <div className="px-4 space-y-4  overflow-visible">
      {/* حذف کردن container اضافی دور Debt */}
      <Debt paymentList={paymentList} parentGUID={guid} />
    </div>
  );
}
