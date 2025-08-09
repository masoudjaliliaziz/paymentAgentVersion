import Debt from "../components/debt/Debt";

import { useParentGuid } from "../hooks/useParentGuid";

export default function DebtsPage() {
  const guid = useParentGuid();

  return (
    <div className="px-4 space-y-4  overflow-visible">
      {/* حذف کردن container اضافی دور Debt */}
      <Debt parentGUID={guid} />
    </div>
  );
}
