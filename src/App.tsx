import { usePayment } from "./hooks/usePayment";
import { useParentGuid } from "./hooks/useParentGuid";
import { useEffect, useState } from "react";
import { setPayments, setUser, setUserRole } from "./store/agentSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store/store";
import { PaymentRow } from "./components/PaymentRow";
import { useCurrentUser } from "./hooks/useUser";
import { useUserRoles } from "./hooks/useUserRoles";
import { calculateRasDatePayment } from "./utils/calculateRasDate";
import { getShamsiDateFromDayOfYear } from "./utils/getShamsiDateFromDayOfYear";
import type { PaymentType } from "./types/apiTypes";

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

  const [selectedPayments, setSelectedPayments] = useState<PaymentType[]>([]);
  const [selectedRasDate, setSelectedRasDate] = useState<number | null>(null);

  const togglePaymentSelection = (payment: PaymentType) => {
    setSelectedPayments((prev) => {
      const exists = prev.find((p) => p.ID === payment.ID);
      return exists
        ? prev.filter((p) => p.ID !== payment.ID)
        : [...prev, payment];
    });
  };

  useEffect(() => {
    if (selectedPayments.length > 0) {
      const calculated = calculateRasDatePayment(selectedPayments);
      setSelectedRasDate(calculated);
    } else {
      setSelectedRasDate(null);
    }
  }, [selectedPayments]);

  return (
    <div
      className="min-h-screen   relative  top-6"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr",
        gap: "20px",
      }}
    >
      <div className="bg-white  rounded-lg  font-bold text-xl shadow-md flex justify-center items-start sticky top-0 p-6 ">
        {selectedRasDate && (
          <div className=" flex flex-col gap-3 justify-center items-center">
            <span className="text-sky-500 text-sm font-bold">
              راس پرداخت‌های انتخاب‌شده
            </span>
            <span className="text-slate-500 text-lg font-bold">
              {getShamsiDateFromDayOfYear(selectedRasDate)}
            </span>
          </div>
        )}
      </div>
      <div className=" ">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}

        {paymentData?.filter((item) => item.status === "0").length === 0 && (
          <p>هیچ پرداختی با وضعیت "در انتظار" یافت نشد.</p>
        )}

        {paymentData
          ?.filter((item) => item.status === "0")
          .map((item) => (
            <PaymentRow
              key={item.ID}
              parentGuid={guid}
              item={item}
              onToggleSelect={() => togglePaymentSelection(item)}
              isSelected={!!selectedPayments.find((p) => p.ID === item.ID)}
            />
          ))}
      </div>
    </div>
  );
}

export default App;
