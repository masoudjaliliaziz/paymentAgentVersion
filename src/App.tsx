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

const specialUsers = [
  "i:0#.w|zarsim\\rashaadmin",
  "i:0#.w|zarsim\\mesmaeili",
  "i:0#.w|zarsim\\mmoradabadi",
];

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

  const { isAgent, isMaster } = useUserRoles(userData ?? null);
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

  const [filters, setFilters] = useState({
    sayadiCode: "",
    dueDate: "",
    price: "",
    seriesNo: "",
    serialNo: "",
    SalesExpert: "",
    iban: "",
    name: "",
  });

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

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredPayments = paymentData
    ?.filter((item) => {
      if (isAgent) return item.status === "0";
      if (isMaster) return item.status === "1";
      return false;
    })
    .filter((item) => {
      // اگه یوزر در specialUsers هست، همه رو نشون بده
      if (userData && specialUsers.includes(userData)) {
        return true;
      }
      // وگرنه فقط مواردی که SalesExpertAcunt_text برابر با userData هست رو نگه دار
      if (userData) {
        return item.SalesExpertAcunt_text === userData;
      }
      return false;
    })
    .filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return (item[key as keyof PaymentType] ?? "")
          .toString()
          .includes(value);
      });
    });

  return (
    <div className="flex gap-6 mt-6 px-4">
      <div className="w-1/4 sticky top-0 self-start bg-white shadow-sm p-4 flex flex-col gap-4 border rounded-md h-fit max-h-screen overflow-y-auto">
        <div className="flex flex-col gap-4 items-center justify-center">
          <span className="text-sky-500 text-sm font-bold">
            راس پرداخت‌های انتخاب‌شده
          </span>
          <span className="text-slate-500 text-lg font-bold">
            {selectedRasDate
              ? getShamsiDateFromDayOfYear(selectedRasDate)
              : "چکی انتخاب نشده"}
          </span>
        </div>

        {/* فیلترها */}
        <div className="flex flex-col w-full gap-2 text-sm">
          {Object.entries({
            sayadiCode: "کد صیادی (مثلاً ۱۲۳۴۵۶)",
            price: "مبلغ (مثلاً ۵۰۰۰۰۰۰)",
            seriesNo: "شماره سری (مثلاً ۱۲۳)",
            serialNo: "شماره سریال (مثلاً ۹۸۷۶۵۴)",
            SalesExpert: "کارشناس فروش (مثلاً سمیرا علی‌پور)",
            iban: "شماره شبا (مثلاً IR123...)",
            name: "نام مشتری (مثلاً علی رضایی)",
          }).map(([key, placeholder]) => (
            <div key={key} className="flex flex-col">
              <label className="mb-1 text-gray-600">
                {placeholder.split(" (")[0]}
              </label>
              <input
                className="border p-1 rounded-md"
                placeholder={placeholder}
                value={filters[key as keyof typeof filters]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="w-3/4">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}

        {filteredPayments?.length === 0 && (
          <p>هیچ پرداختی مطابق فیلتر یافت نشد.</p>
        )}

        {filteredPayments?.map((item) => (
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
