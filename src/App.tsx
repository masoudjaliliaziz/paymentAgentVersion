import { useEffect, useState } from "react";
import { setPayments, setUser, setUserRole } from "./store/agentSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store/store";
import { useUserRoles } from "./hooks/useUserRoles";
import { calculateRasDatePayment } from "./utils/calculateRasDate";
import { getShamsiDateFromDayOfYear } from "./utils/getShamsiDateFromDayOfYear";
import type { PaymentType } from "./types/apiTypes";
import { useAllPayment } from "./hooks/useAllPayments";
import { PaymentRowTr } from "./components/PaymentRowTr";
import { updateSayadVerified } from "./api/updateItem";
import { Captions, CaptionsOff, Check, X } from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "./hooks/useUser";

const specialUsers = [
  "i:0#.w|zarsim\\rashaadmin",
  "i:0#.w|zarsim\\mesmaeili",
  "i:0#.w|zarsim\\mmoradabadi",
];

function App() {
  const dispatch: AppDispatch = useDispatch();
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [verifyAllIds, setVerifyAllIds] = useState<string[]>([]);
  const [shownSayadConfirmTrChecks, setShownSayadConfirmTrChecks] =
    useState<boolean>(false);
  const [shownSayadUnConfirmTrChecks, setShownSayadUnConfirmTrChecks] =
    useState<boolean>(false);
  const [shownConfirmTrChecks, setShownConfirmTrChecks] =
    useState<boolean>(false);
  const [shownUnConfirmTrChecks, setShownUnConfirmTrChecks] =
    useState<boolean>(false);
  const [completedVerifications, setCompletedVerifications] = useState<
    string[]
  >([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "dueDate",
    direction: "asc",
  });

  const {
    data: paymentData,
    isLoading: paymentLoading,
    error: paymentError,
  } = useAllPayment();
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();
  const { isAgent, isMaster } = useUserRoles(userData ?? null);
  const error = userError || paymentError;
  const isLoading = paymentLoading || userLoading;

  const [selectedPayments, setSelectedPayments] = useState<PaymentType[]>([]);
  const [selectedRasDate, setSelectedRasDate] = useState<number | null>(null);
  // استیت جدید برای ذخیره Title‌ها
  const [customerTitles, setCustomerTitles] = useState<Map<string, string>>(
    new Map()
  );

  // تابع callback برای به‌روزرسانی Title
  const updateCustomerTitle = (parentGUID: string, title: string) => {
    setCustomerTitles((prev) => new Map(prev).set(parentGUID, title));
  };

  useEffect(() => {
    if (userData && paymentData) {
      dispatch(setPayments(paymentData));
      dispatch(setUser(userData));
      dispatch(setUserRole(isAgent ? "agent" : "master"));
    }
  }, [paymentData, dispatch, userData, isAgent]);

  const processVerifyAll = async (ids: string[]) => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        await updateSayadVerified(Number(id));
        setCompletedVerifications((prev) => [...prev, id]);
      } catch (error) {
        setErrorMessages((prev) => [
          ...prev,
          `خطا برای ID ${id}: ${error || "نامشخص"}`,
        ]);
      }
      await new Promise((res) => setTimeout(res, 200));
    }
    setIsVerifyingAll(false);
  };

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

  const verifyAllPayments = () => {
    const eligibleIds = filteredPayments.map((p) => String(p.ID));
    if (!eligibleIds.length) return;

    setVerifyAllIds(eligibleIds);
    setIsVerifyingAll(true);
    setCompletedVerifications([]);
    setErrorMessages([]);
    processVerifyAll(eligibleIds);
  };

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

  const sortPayments = (payments: PaymentType[]) => {
    return [...payments].sort((a, b) => {
      const key = sortConfig.key as keyof PaymentType;
      const valueA = a[key] ?? "";
      const valueB = b[key] ?? "";

      if (key === "price") {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      } else if (key === "dueDate") {
        return sortConfig.direction === "asc"
          ? valueA.toString().localeCompare(valueB.toString())
          : valueB.toString().localeCompare(valueA.toString());
      }
      return 0;
    });
  };

  const [filters, setFilters] = useState({
    sayadiCode: "",
    dueDate: "",
    price: "",
    seriesNo: "",
    serialNo: "",
    SalesExpert: "",
    iban: "",
    name: "",
    Title: "", // فیلتر جدید برای Title
  });

  const filteredPayments =
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
      })
      .filter((item) => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === "Title") {
            const title = customerTitles.get(item.parentGUID) ?? "";
            return title.toLowerCase().includes(value.toLowerCase());
          }
          return (item[key as keyof PaymentType] ?? "")
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        });
      }) ?? [];

  const sortedPayments = sortPayments(filteredPayments);

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

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSayadConfirmTrChecks = () => {
    const newState = !shownSayadConfirmTrChecks;
    setShownSayadConfirmTrChecks(newState);
    if (newState) {
      setShownSayadUnConfirmTrChecks(false);
      setShownConfirmTrChecks(false);
      setShownUnConfirmTrChecks(false);
    }
  };

  const toggleSayadUnConfirmTrChecks = () => {
    const newState = !shownSayadUnConfirmTrChecks;
    setShownSayadUnConfirmTrChecks(newState);
    if (newState) {
      setShownSayadConfirmTrChecks(false);
      setShownConfirmTrChecks(false);
      setShownUnConfirmTrChecks(false);
    }
  };

  const toggleConfirmTrChecks = () => {
    const newState = !shownConfirmTrChecks;
    setShownConfirmTrChecks(newState);
    if (newState) {
      setShownSayadConfirmTrChecks(false);
      setShownSayadUnConfirmTrChecks(false);
      setShownUnConfirmTrChecks(false);
    }
  };

  const toggleUnConfirmTrChecks = () => {
    const newState = !shownUnConfirmTrChecks;
    setShownUnConfirmTrChecks(newState);
    if (newState) {
      setShownSayadConfirmTrChecks(false);
      setShownSayadUnConfirmTrChecks(false);
      setShownConfirmTrChecks(false);
    }
  };

  const getDisplayedPayments = () => {
    if (!Array.isArray(paymentData) || !Array.isArray(sortedPayments)) {
      return [];
    }

    if (shownSayadConfirmTrChecks) {
      return (
        paymentData.filter((data) => data?.VerifiedConfirmSayadTr === "1") ?? []
      );
    }
    if (shownSayadUnConfirmTrChecks) {
      return (
        paymentData.filter((data) => data?.VerifiedRejectSayadTr === "1") ?? []
      );
    }
    if (shownConfirmTrChecks) {
      return paymentData.filter((data) => data?.status === "4") ?? [];
    }
    if (shownUnConfirmTrChecks) {
      return paymentData.filter((data) => data?.status === "3") ?? [];
    }
    if (isMaster) {
      return sortedPayments.filter((data) => data?.status === "1") ?? [];
    }
    return [];
  };
  const displayedPayments = getDisplayedPayments();

  return (
    <div className="flex gap-6 mt-6 px-4">
      <div className="w-1/4 sticky top-0 self-start bg-white shadow-sm p-4 flex flex-col gap-4 border rounded-md h-fit max-h-screen overflow-y-auto">
        <div className="flex w-full items-center justify-center gap-2 flex-col">
          <div
            className={clsx(
              "p-1 rounded-md flex items-center justify-between gap-2 w-full",
              {
                "bg-sky-500 text-white": shownSayadConfirmTrChecks,
                "hover:bg-sky-200 hover:text-sky-800 cursor-pointer": true,
              }
            )}
            onClick={toggleSayadConfirmTrChecks}
          >
            <Captions />
            <span className="text-xs font-bold">
              چک‌های تأییدشده در سامانه صیاد
            </span>
          </div>
          <div
            className={clsx(
              "p-1 w-full rounded-md flex items-center justify-between gap-2",
              {
                "bg-sky-500 text-white": shownSayadUnConfirmTrChecks,
                "hover:bg-sky-200 hover:text-sky-800 cursor-pointer": true,
              }
            )}
            onClick={toggleSayadUnConfirmTrChecks}
          >
            <CaptionsOff />
            <span className="text-xs font-bold">
              چک‌های ردشده در سامانه صیاد
            </span>
          </div>
          <div
            className={clsx(
              "p-1 rounded-md flex items-center justify-between gap-2 w-full",
              {
                "bg-sky-500 text-white": shownConfirmTrChecks,
                "hover:bg-sky-200 hover:text-sky-800 cursor-pointer": true,
              }
            )}
            onClick={toggleConfirmTrChecks}
          >
            <Check />
            <span className="text-xs font-bold">چک‌های تأییدشده خزانه</span>
          </div>
          <div
            className={clsx(
              "p-1 rounded-md flex items-center justify-between gap- w-full",
              {
                "bg-sky-500 text-white": shownUnConfirmTrChecks,
                "hover:bg-sky-200 hover:text-sky-800 cursor-pointer": true,
              }
            )}
            onClick={toggleUnConfirmTrChecks}
          >
            <X />
            <span className="text-xs font-bold">چک‌های ردشده خزانه</span>
          </div>
        </div>
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

            serialNo: "شماره سریال (مثلاً ۹۸۷۶۵۴)",
            SalesExpert: "کارشناس فروش (مثلاً سمیرا علی‌پور)",
            iban: "شماره شبا (مثلاً IR123...)",

            Title: `عنوان مشتری (مثلاً ${
              customerTitles.values().next().value || "شرکت نمونه"
            })`,
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
      </div>

      <div className="w-3/4">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}

        {displayedPayments.length === 0 && (
          <p>هیچ پرداختی مطابق فیلتر یافت نشد.</p>
        )}

        <div className="mb-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSort("price")}
              className={`px-4 py-2 rounded-md ${
                sortConfig.key === "price"
                  ? sortConfig.direction === "asc"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              مرتب‌سازی بر اساس مبلغ
            </button>
            <button
              type="button"
              onClick={() => handleSort("dueDate")}
              className={`px-4 py-2 rounded-md ${
                sortConfig.key === "dueDate"
                  ? sortConfig.direction === "asc"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              مرتب‌سازی بر اساس تاریخ
            </button>
          </div>
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
          <button
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
          </button>
        </div>

        {displayedPayments.map((item, i) => (
          <PaymentRowTr
            key={item.ID}
            index={i}
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
            onUpdateTitle={updateCustomerTitle}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
