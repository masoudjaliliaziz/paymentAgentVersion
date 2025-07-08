import { usePayment } from "./hooks/usePayment";
import { useParentGuid } from "./hooks/useParentGuid";
import { useEffect } from "react";
import { setPayments } from "./store/agentSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store/store";
import { PaymentRow } from "./components/PaymentRow"; // اضافه کن

function App() {
  const guid = useParentGuid();
  const dispatch: AppDispatch = useDispatch();
  const { data, isLoading, error } = usePayment(guid);

  useEffect(() => {
    if (data) dispatch(setPayments(data));
  }, [data, dispatch]);

  return (
    <div className="w-full h-dvh relative">
      <div className="flex justify-center items-center bg-sky-700 p-6">
        <span className="text-3xl font-bold text-white">hello guys</span>
      </div>

      <div className="p-4">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}
        {data?.length === 0 && <p>داده‌ای وجود ندارد.</p>}

        {data?.map((item) => (
          <PaymentRow
            key={item.ID}
            parentGuid={guid}
            itemGuid={item.itemGUID}
            seri={item.seri}
            serial={item.serial}
            dueDate={item.dueDate}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
