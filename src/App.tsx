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
import { useCustomers } from "./hooks/useCustomer";
// import DebtsArchivePage from "./routes/DebtsArchivePage";
import { BanknoteArrowUpIcon } from "lucide-react";
// import DebtsPage from "./routes/DebtsPage";
// import { updateSayadVerified } from "./api/updateItem";
import UploadFormTabs from "./components/UploadFormTabs";

const specialUsers = [
  "i:0#.w|zarsim\\rashaadmin",
  "i:0#.w|zarsim\\mesmaeili",
  "i:0#.w|zarsim\\mmoradabadi",
];

function App() {
  const guid = useParentGuid();
  const dispatch: AppDispatch = useDispatch();
  const parentGUID = useParentGuid();
  // const [isShownDebtArchive, setIsShownDebtArchive] = useState(false);
  // const [isShownDebt, setIsShownDebt] = useState(false);
  const [isShownNewPayment, setIsShownNewPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<"normal" | "pending" | "treasury">(
    "normal"
  );
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [verifyAllIds, setVerifyAllIds] = useState<string[]>([]);
  const [completedVerifications, setCompletedVerifications] = useState<
    string[]
  >([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const { data, isLoading: isLoadinCustomer } = useCustomers(parentGUID);
  const {
    data: paymentData,
    isLoading: paymentLoading,
    error: paymentError,
  } = usePayment(guid);

  // دیباگ: بررسی GUID و payment data
  console.log("🔍 دیباگ App.tsx:", {
    guid,
    parentGUID,
    paymentData: paymentData?.length || 0,
    paymentLoading,
    paymentError: paymentError?.message,
  });

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  const { isAgent, isMaster } = useUserRoles(userData ?? null);
  const error = userError || paymentError;
  const isLoading = paymentLoading || userLoading || isLoadinCustomer;

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

  const [typeactiveTab, setTypeActiveTab] = useState<"1" | "2">("1");
  const [customerCode, setCustomerCode] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");

  const togglePaymentSelection = (payment: PaymentType) => {
    setSelectedPayments((prev) => {
      const exists = prev.find((p) => p.ID === payment.ID);
      return exists
        ? prev.filter((p) => p.ID !== payment.ID)
        : [...prev, payment];
    });
  };
  // const processVerifyAll = async (ids: string[]) => {
  //   for (let i = 0; i < ids.length; i++) {
  //     const id = ids[i];
  //     try {
  //       await updateSayadVerified(Number(id)); // مطمئن شوید این تابع وارد شده
  //       setCompletedVerifications((prev) => [...prev, id]);
  //     } catch (error) {
  //       setErrorMessages((prev) => [
  //         ...prev,
  //         `خطا برای ID ${id}: ${error || "نامشخص"}`,
  //       ]);
  //     }
  //     await new Promise((res) => setTimeout(res, 200)); // فاصله زمانی بین درخواست‌ها
  //   }

  //   // بعد از اتمام
  //   setIsVerifyingAll(false);
  // };
  useEffect(() => {
    if (selectedPayments.length > 0) {
      const calculated = calculateRasDatePayment(selectedPayments);
      setSelectedRasDate(calculated);
    } else {
      setSelectedRasDate(null);
    }
  }, [selectedPayments]);

  useEffect(() => {
    if (
      verifyAllIds.length > 0 &&
      completedVerifications.length === verifyAllIds.length
    ) {
      setIsVerifyingAll(false);
      setVerifyAllIds([]);
      setCompletedVerifications([]);
      console.log("دیباگ: همه استعلام‌ها تکمیل شدند", {
        total: verifyAllIds.length,
        errors: errorMessages,
      });
      if (errorMessages.length > 0) {
        console.log("دیباگ: خطاها در استعلام گروهی:", errorMessages);
      }
    }
  }, [completedVerifications, verifyAllIds, errorMessages]);

  // const verifyAllPayments = () => {
  //   const eligibleIds = filteredPayments.map((p) => String(p.ID));
  //   if (!eligibleIds.length) return;

  //   // ابتدا شناسه‌ها را ست می‌کنیم
  //   setVerifyAllIds(eligibleIds);
  //   setIsVerifyingAll(true);
  //   setCompletedVerifications([]);
  //   setErrorMessages([]);

  //   processVerifyAll(eligibleIds);
  // };

  let barcodeBuffer = "";
  let lastInputTime = 0;

  const handleInputChange = (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = event.target.value;
    const now = Date.now();

    if (field === "sayadiCode") {
      const timeDiff = now - lastInputTime;
      lastInputTime = now;

      if (timeDiff < 50) {
        barcodeBuffer += value[value.length - 1] || "";
        if (barcodeBuffer.length >= 16) {
          setFilters((prev) => ({ ...prev, sayadiCode: barcodeBuffer }));
          barcodeBuffer = "";
        }
        return;
      } else {
        value = value.slice(-16);
      }
    }

    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const filteredPayments =
    paymentData
      ?.filter((item) => {
        // فیلتر بر اساس تب فعال
        if (activeTab === "treasury") {
          return item.status === "4"; // چک‌های تایید شده توسط خزانه
        } else if (activeTab === "pending") {
          return item.status === "1"; // چک‌های در انتظار تایید خزانه
        } else {
          // حالت عادی - چک‌های در انتظار تایید کارشناس
          return item.status === "0";
        }
      })
      .filter((item) => {
        if (userData && specialUsers.includes(userData)) {
          return true;
        }
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
      }) ?? [];

  // دیباگ: بررسی فیلترها
  console.log("🔍 دیباگ فیلترها:", {
    totalPayments: paymentData?.length || 0,
    afterStatusFilter:
      paymentData?.filter((item) => {
        if (isAgent) return item.status === "0";
        if (isMaster) {
          return (
            item.status === "1" ||
            (item.cash === "1" && item.status !== "3" && item.status !== "4")
          );
        }
        return false;
      }).length || 0,
    afterUserFilter:
      paymentData
        ?.filter((item) => {
          if (isAgent) return item.status === "0";
          if (isMaster) {
            return (
              item.status === "1" ||
              (item.cash === "1" && item.status !== "3" && item.status !== "4")
            );
          }
          return false;
        })
        .filter((item) => {
          if (userData && specialUsers.includes(userData)) {
            return true;
          }
          if (userData) {
            return item.SalesExpertAcunt_text === userData;
          }
          return false;
        }).length || 0,
    finalFilteredCount: filteredPayments.length,
    userData,
    isAgent,
    isMaster,
    specialUsers,
  });

  const totalSelectedPrice = selectedPayments.reduce(
    (sum, p) => sum + Number(p.price || 0),
    0
  );

  const areAllSelected =
    filteredPayments.length > 0 &&
    filteredPayments.every((p) =>
      selectedPayments.some((sp) => sp.ID === p.ID)
    );

  const selectAllPayments = () => {
    setSelectedPayments(filteredPayments);
  };

  const deselectAllPayments = () => {
    setSelectedPayments([]);
  };

  return (
    <div className="flex gap-6 mt-6 px-4">
      <div className="w-[40%] sticky top-0 self-start bg-white shadow-sm p-4 flex flex-col gap-4 border rounded-md h-fit max-h-screen overflow-y-auto ">
        {/* تب‌های اصلی */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-3">
            <div
              onClick={() => setIsShownNewPayment((cur) => !cur)}
              className={`flex items-center justify-center text-xs font-bold border-2 border-slate-800 rounded-md text-slate-800 cursor-pointer hover:bg-slate-800 hover:text-white px-2 py-1 gap-2 ${
                isShownNewPayment ? "bg-slate-800 text-white" : ""
              }`}
            >
              ثبت پرداخت 
              <BanknoteArrowUpIcon width={20} height={20} />
            </div>
            {/* تب‌های نمایش چک‌ها */}

            <div
              onClick={() => setActiveTab("normal")}
              className={`px-3 py-2 text-xs font-bold rounded-md transition-colors duration-200 cursor-pointer flex justify-center items-center ${
                activeTab === "normal"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
               در انتظار تایید کارشناس
            </div>
            <div
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-2 text-xs font-bold rounded-md transition-colors duration-200 cursor-pointer flex justify-center items-center ${
                activeTab === "pending"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
               در انتظار تایید خزانه
            </div>
            <div
              onClick={() => setActiveTab("treasury")}
              className={`px-3 py-2 text-xs font-bold rounded-md transition-colors duration-200 cursor-pointer flex justify-center items-center ${
                activeTab === "treasury"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
               تایید شده توسط خزانه
            </div>
          </div>
        </div>
        {isShownNewPayment && (
          <div className="flex flex-col w-full gap-2 text-sm">
            <UploadFormTabs
              parent_GUID={guid}
              typeactiveTab={typeactiveTab}
              setTypeActiveTab={setTypeActiveTab}
              customerCode={customerCode}
              customerTitle={customerTitle}
              onCustomerDataChange={(code, title) => {
                setCustomerCode(code);
                setCustomerTitle(title);
              }}
            />
          </div>
        )}{" "}
        {!isShownNewPayment && (
          <>
            <span className="text-sm font-bold mb-4 text-base-content w-full bg-base-300 text-center rounded-lg px-2 py-1 bg-slate-800 text-white">
              {data?.[0]?.Title ?? "در حال بارگذاری..."}
            </span>
            <div className="flex flex-col gap-4 items-center justify-center">
              <span className="text-sky-500 text-sm font-bold">
                راس پرداخت‌های انتخاب‌شده
              </span>
              <span className="text-slate-500 text-lg font-bold">
                {selectedRasDate
                  ? getShamsiDateFromDayOfYear(selectedRasDate)
                  : "چکی انتخاب نشده"}
              </span>
              <span className="text-green-500 text-sm font-bold">
                جمع کل چک‌های انتخاب‌شده
              </span>
              <div className="flex flex-row-reverse gap-3 items-center justify-center">
                <span className="text-slate-700 text-lg font-bold mt-2">
                  {totalSelectedPrice.toLocaleString("fa-IR")}
                </span>
                <span className="text-sky-700 text-sm font-semibold mt-2">
                  ریال
                </span>
              </div>
            </div>

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
                    onChange={(e) => handleInputChange(key, e)}
                    onKeyDown={handleInputKeyDown}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* {isShownDebtArchive && (
        <div className={`${isShownDebt ? "w-1/2" : "w-3/4"}`}>
          <DebtsArchivePage paymentList={selectedPayments} />
        </div>
      )} */}

      {
        <div className="w-[60%]">
          {isLoading && <p>در حال بارگذاری...</p>}
          {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}

          {filteredPayments.length === 0 && (
            <p>هیچ پرداختی مطابق فیلتر یافت نشد.</p>
          )}

          {errorMessages.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-md">
              <p className="text-red-700 font-semibold">
                خطاها در استعلام گروهی:
              </p>
              <ul className="list-disc list-inside">
                {errorMessages.map((msg, index) => (
                  <li key={index} className="text-red-600">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4 flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={areAllSelected}
                onChange={() => {
                  if (areAllSelected) {
                    deselectAllPayments();
                  } else {
                    selectAllPayments();
                  }
                }}
                id="selectAllCheckbox"
                className="cursor-pointer"
              />
              <label
                htmlFor="selectAllCheckbox"
                className="cursor-pointer select-none text-xl font-bold"
              >
                انتخاب همه
              </label>
            </div>
            {/* <button
              onClick={verifyAllPayments}
              disabled={isVerifyingAll || filteredPayments.length === 0}
              className={`px-4 py-2 rounded-md text-white font-semibold ${
                isVerifyingAll || filteredPayments.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-600"
              }`}
            >
              {isVerifyingAll
                ? `در حال استعلام (${completedVerifications.length}/${verifyAllIds.length})`
                : "استعلام همه"}
            </button> */}
          </div>

          {filteredPayments.map((item) => (
            <PaymentRow
              key={item.ID}
              parentGuid={guid}
              item={item}
              onToggleSelect={() => togglePaymentSelection(item)}
              isSelected={!!selectedPayments.find((p) => p.ID === item.ID)}
              isVerifyingAll={isVerifyingAll}
              verifyAllIds={verifyAllIds}
              onVerificationComplete={(id: string, error?: string) => {
                setCompletedVerifications((prev) => [...prev, id]);
                if (error) {
                  setErrorMessages((prev) => [
                    ...prev,
                    `خطا برای ID ${id}: ${error}`,
                  ]);
                }
              }}
            />
          ))}
        </div>
      }
      {/* {isShownDebt && (
        <div className={`${isShownDebtArchive ? "w-1/2" : "w-3/4"}`}>
          <DebtsPage paymentList={selectedPayments} />
        </div>
      )}  */}
    </div>
  );
}

export default App;
