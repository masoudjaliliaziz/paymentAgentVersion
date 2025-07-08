import { usePayment } from "./hooks/usePayment";
import { useParentGuid } from "./hooks/useParentGuid";
import { useEffect } from "react";
import { setPayments, setUser, setUserRole } from "./store/agentSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store/store";
import { PaymentRow } from "./components/PaymentRow"; // اضافه کن
import { useCurrentUser } from "./hooks/useUser";
import { useUserRoles } from "./hooks/useUserRoles";

function App() {
  const guid = useParentGuid();
  const dispatch: AppDispatch = useDispatch();
  const {
    data: paymentData,
    isLoading: paymentLoading,
    error: paymentError,
  } = usePayment(guid);
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const { isAgent } = useUserRoles(userData ?? null);
  const error = userError || paymentError;
  const isLoading = paymentLoading || userLoading;

  useEffect(() => {
    if (userData && paymentData) {
      dispatch(setPayments(paymentData));
      dispatch(setUser(userData));
      dispatch(setUserRole(isAgent ? "agent" : "master"));
    }
  }, [paymentData, dispatch, userData, isAgent]);

  return (
    <div className="w-full h-dvh relative">
      <div className="flex justify-center items-center bg-sky-700 p-6">
        <span className="text-3xl font-bold text-white">
          مدیریت مالی (دولوپ)
        </span>
      </div>

      <div className="p-4">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}
        {paymentData?.length === 0 && <p>داده‌ای وجود ندارد.</p>}

        {paymentData?.map((item) => (
          <PaymentRow
            price={item.price}
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
