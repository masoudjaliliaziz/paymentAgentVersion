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
import { BanknoteArrowUpIcon, FileTerminal, QrCode } from "lucide-react";
// import DebtsPage from "./routes/DebtsPage";
// import { updateSayadVerified } from "./api/updateItem";
import UploadFormTabs from "./components/UploadFormTabs";
import { useSubCustomers } from "./hooks/useSubCustomer";
import { exportToExcel } from "./utils/exportToExel";
import { DateObject } from "react-multi-date-picker";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const specialUsers = [
  "i:0#.w|zarsim\\rashaadmin",
  "i:0#.w|zarsim\\mesmaeili",
  "i:0#.w|zarsim\\mmoradabadi",
];
export type InvoiceType = "1" | "2" | "3" | "4" | "5";
export type InvoiceTypeFilter = InvoiceType | "all";

const toComparableTime = (value?: string | null): number | null => {
  if (!value) return null;

  // اگر dueDate به صورت شمسی مثل 1404/05/10 ذخیره شده
  const persianDate = new DateObject({
    date: value,
    format: "YYYY/MM/DD",
    calendar: persian,
    locale: persian_fa,
  });

  const jsDate = persianDate.toDate();

  if (Number.isNaN(jsDate.getTime())) {
    return null;
  }

  return jsDate.getTime();
};

const isInRange = (value?: string | null, range?: DateObject[]): boolean => {
  if (!range || range.length === 0) return true;

  const itemTime = toComparableTime(value);
  if (itemTime === null) return false;

  const start = range[0]?.toDate?.();
  const end = range[1]?.toDate?.() ?? range[0]?.toDate?.();

  if (!start || !end) return true;

  const startTime = new Date(start);
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(end);
  endTime.setHours(23, 59, 59, 999);

  return itemTime >= startTime.getTime() && itemTime <= endTime.getTime();
};
const isCreatedDateInRange = (
  value: string | undefined | null,
  range: DateObject[] | undefined,
) => {
  if (!range || range.length !== 2) return true;
  if (!value) return false;

  const [start, end] = range;

  const startDate = start.toDate();
  const endDate = end.toDate();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const createdDate = new Date(value);

  if (Number.isNaN(createdDate.getTime())) {
    return false;
  }

  return (
    createdDate.getTime() >= startDate.getTime() &&
    createdDate.getTime() <= endDate.getTime()
  );
};
function App() {
  const guid = useParentGuid();
  const dispatch: AppDispatch = useDispatch();
  const parentGUID = useParentGuid();
  // const [isShownDebtArchive, setIsShownDebtArchive] = useState(false);
  // const [isShownDebt, setIsShownDebt] = useState(false);
  const [isShownNewPayment, setIsShownNewPayment] = useState(false);
  const [dateRange, setDateRange] = useState<DateObject[]>([]);
  const [createdDateRange, setCreatedDateRange] = useState<DateObject[]>([]);
  const [paymentType, setPaymentType] = useState("");

  const [activeTab, setActiveTab] = useState<
    "normal" | "pending" | "treasury" | "trDenied" | "all"
  >("all");
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

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();
  const { isAgent } = useUserRoles(userData ?? null);
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
    Title: "",
  });

  const [typeactiveTab, setTypeActiveTab] = useState<InvoiceTypeFilter>("all");
  const [customerCode, setCustomerCode] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");

  const { data: subCustomers, isLoading: isLoadingSubCustomers } =
    useSubCustomers(customerCode);

  const subCustomerHeader = subCustomers?.find(
    (sub) => sub.Title?.trim() === "سرگروه",
  );
  const customerCodeHeader = subCustomerHeader?.CodeM2 ?? "";
  const customerNameHeader = subCustomerHeader?.customer_M2 ?? "";

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
    event: React.ChangeEvent<HTMLInputElement>,
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
  const filteredPayments = (paymentData ?? [])
    .filter((item) => {
      if (activeTab === "treasury") {
        return item.status === "4";
      }
      if (activeTab === "pending") {
        return item.status === "1";
      }
      if (activeTab === "trDenied") {
        return item.status === "3";
      }
      if (activeTab === "all") {
        return true;
      }
      return item.status === "0";
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
      if (typeactiveTab !== "all" && item.invoiceType !== typeactiveTab) {
        return false;
      }

      if (paymentType !== "" && String(item.cash) !== String(paymentType)) {
        return false;
      }

      // تاريخ سررسيد: اگر اسم فيلدت فرق دارد، dueDate را عوض کن
      if (!isInRange(item.dueDate, dateRange)) {
        return false;
      }

      // تاريخ ثبت: اگر اسم فيلدت فرق دارد، Created را عوض کن
      if (!isCreatedDateInRange(item.Created, createdDateRange)) {
        return false;
      }

      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return (item[key as keyof PaymentType] ?? "")
          .toString()
          .includes(value);
      });
    });

  const totalSelectedPrice = selectedPayments.reduce(
    (sum, p) => sum + Number(p.price || 0),
    0,
  );

  const areAllSelected =
    filteredPayments.length > 0 &&
    filteredPayments.every((p) =>
      selectedPayments.some((sp) => sp.ID === p.ID),
    );

  const selectAllPayments = () => {
    setSelectedPayments(filteredPayments);
  };

  const deselectAllPayments = () => {
    setSelectedPayments([]);
  };

  useEffect(() => {
    if (customerCode && subCustomers) {
      console.log(subCustomers);
    }
  }, [customerCode, subCustomers]);

  const handleExportToExcel = () => {
    try {
      // استفاده از displayedPayments که چک‌های فیلتر شده فعلی را شامل می‌شود
      if (filteredPayments.length === 0) {
        alert("هیچ چکی برای export وجود ندارد!");
        return;
      }

      // فراخوانی تابع exportToExcel با چک‌های فیلتر شده
      exportToExcel(
        filteredPayments,
        `چک_های_فیلتر_شده_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );

      console.log(`تعداد ${filteredPayments.length} چک به Excel export شد`);
    } catch (error) {
      console.error("خطا در export به Excel:", error);
      alert("خطا در ایجاد فایل Excel. لطفاً دوباره تلاش کنید.");
    }
  };

  if (isLoadingSubCustomers)
    return <div>در حال بارگذاری مشتری های مربوط به هم...</div>;

  return (
    <div className="flex gap-6 mt-6 px-4">
      <div className="w-[40%] sticky top-0 self-start bg-white shadow-sm p-4 flex flex-col gap-4 border rounded-md h-fit max-h-screen overflow-y-auto ">
        <a
          className="flex justify-center items-center  h-8 rounded-md bg-slate-700 text-white  top-1 right-1 hover:bg-white hover:text-slate-700 cursor-pointer  mx-auto p-3 gap-2"
          href="https://portal.zarsim.com/Pages/checkfori.aspx"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-white">سیستم چک برگشتی</span>
          <QrCode width={20} height={20} />
        </a>
        {/* تب‌های اصلی */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {/* ثبت پرداخت */}
            <div
              onClick={() => setIsShownNewPayment((cur) => !cur)}
              className={`flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-xs font-bold transition-all duration-200 ${
                isShownNewPayment
                  ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                  : "border-slate-800 bg-white text-slate-800 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BanknoteArrowUpIcon width={19} height={19} />
              <span>ثبت پرداخت</span>
            </div>

            {/* Dropdown وضعیت پرداخت */}
            <div className="relative min-w-[220px]">
              <select
                value={activeTab}
                onChange={(e) =>
                  setActiveTab(
                    e.target.value as
                      | "normal"
                      | "pending"
                      | "trDenied"
                      | "treasury"
                      | "all",
                  )
                }
                className={`min-h-10 w-full cursor-pointer appearance-none rounded-lg border px-4 py-2 pl-10 text-right text-xs font-bold outline-none transition-all duration-200 ${
                  activeTab === "normal"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : activeTab === "pending"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : activeTab === "trDenied"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : activeTab === "treasury"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                } focus:ring-2 focus:ring-primary-200`}
              >
                <option value="normal">در انتظار تایید کارشناس</option>
                <option value="pending">در انتظار تایید خزانه</option>
                <option value="trDenied">رد شده توسط خزانه</option>
                <option value="treasury">تایید شده توسط خزانه</option>
                <option value="all">همه پرداخت‌ها</option>
              </select>

              {/* فلش Dropdown */}
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {isShownNewPayment && (
          <div className="flex flex-col w-full gap-2 text-sm">
            <UploadFormTabs
              parent_GUID={guid}
              typeactiveTab={typeactiveTab === "all" ? "4" : typeactiveTab}
              setTypeActiveTab={setTypeActiveTab as (v: InvoiceType) => void}
              customerCode={customerCode}
              customerTitle={customerTitle}
              onCustomerDataChange={(code, title) => {
                setCustomerCode(code);
                setCustomerTitle(title);
              }}
              customerCodeHeader={customerCodeHeader}
              customerNameHeader={customerNameHeader}
            />
          </div>
        )}{" "}
        {!isShownNewPayment && (
          <>
            <div className="grid grid-cols-1  gap-4 items-start">
              {/* ===================================================== */}
              {/* باکس خلاصه اطلاعات */}
              {/* ===================================================== */}

              <div
                className="
        flex
        min-h-full
        flex-col
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
      "
              >
                {/* عنوان */}
                <div
                  className="
          mb-5
          w-full
          rounded-lg
          bg-slate-800
          px-3
          py-2
          text-center
          text-sm
          font-bold
          text-white
        "
                >
                  {data?.[0]?.Title ?? "در حال بارگذاری..."}
                </div>

                {/* اطلاعات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* راس */}
                  <div
                    className="
            flex
            flex-col
            items-center
            justify-center
            rounded-lg
            bg-sky-50
            px-3
            py-4
          "
                  >
                    <span className="mb-2 text-xs font-bold text-sky-500">
                      راس پرداخت‌های انتخاب‌شده
                    </span>

                    <span className="text-base font-bold text-slate-700 sm:text-lg">
                      {selectedRasDate
                        ? getShamsiDateFromDayOfYear(selectedRasDate)
                        : "چکی انتخاب نشده"}
                    </span>
                  </div>

                  {/* مبلغ */}
                  <div
                    className="
            flex
            flex-col
            items-center
            justify-center
            rounded-lg
            bg-green-50
            px-3
            py-4
          "
                  >
                    <span className="mb-2 text-xs font-bold text-green-500">
                      جمع کل چک‌های انتخاب‌شده
                    </span>

                    <div className="flex flex-row-reverse items-center gap-2">
                      <span className="text-base font-bold text-slate-700 sm:text-lg">
                        {totalSelectedPrice.toLocaleString("fa-IR")}
                      </span>

                      <span className="text-xs font-semibold text-sky-700">
                        ریال
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================================================== */}
              {/* باکس فیلترها */}
              {/* ===================================================== */}

              <div
                className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
      "
              >
                {/* هدر فیلتر */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    فیلتر و جستجو
                  </span>

                  <button
                    type="button"
                    onClick={handleExportToExcel}
                    disabled={filteredPayments.length === 0}
                    className="
            flex
            min-h-9
            items-center
            gap-2
            rounded-lg
            px-3
            py-2
            text-xs
            font-bold
            text-white
            transition

            bg-green-500
            hover:bg-green-600

            disabled:cursor-not-allowed
            disabled:bg-gray-400
          "
                  >
                    <FileTerminal size={16} />
                    <span>خروجی اکسل</span>
                  </button>
                </div>

                {/* ===================================================== */}
                {/* فیلترها */}
                {/* ===================================================== */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* بازه تاریخ سررسید */}
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-xs font-semibold text-slate-600">
                      بازه تاریخ سررسید
                    </label>

                    <DatePicker
                      value={dateRange}
                      onChange={(dates) => {
                        if (Array.isArray(dates)) {
                          setDateRange(dates);
                        } else {
                          setDateRange([]);
                        }
                      }}
                      calendar={persian}
                      locale={persian_fa}
                      range
                      rangeHover
                      numberOfMonths={2}
                      className="w-full"
                      containerClassName="w-full"
                      inputClass="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              p-2
              text-right
              text-sm
              outline-none
              focus:border-sky-500
              focus:ring-2
              focus:ring-sky-100
            "
                      placeholder="از تاریخ - تا تاریخ"
                    />

                    {dateRange.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDateRange([])}
                        className="
                mt-1
                text-right
                text-xs
                font-semibold
                text-red-500
                hover:text-red-700
              "
                      >
                        پاک کردن فیلتر تاریخ
                      </button>
                    )}
                  </div>

                  {/* بازه تاریخ ثبت */}
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-xs font-semibold text-slate-600">
                      بازه تاریخ ثبت چک
                    </label>

                    <DatePicker
                      value={createdDateRange}
                      onChange={(dates) => {
                        if (Array.isArray(dates)) {
                          setCreatedDateRange(dates);
                        } else {
                          setCreatedDateRange([]);
                        }
                      }}
                      calendar={persian}
                      locale={persian_fa}
                      range
                      rangeHover
                      numberOfMonths={2}
                      className="w-full"
                      containerClassName="w-full"
                      inputClass="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              p-2
              text-right
              text-sm
              outline-none
              focus:border-sky-500
              focus:ring-2
              focus:ring-sky-100
            "
                      placeholder="از تاریخ ثبت - تا تاریخ ثبت"
                    />

                    {createdDateRange.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCreatedDateRange([])}
                        className="
                mt-1
                text-right
                text-xs
                font-semibold
                text-red-500
                hover:text-red-700
              "
                      >
                        پاک کردن فیلتر تاریخ ثبت
                      </button>
                    )}
                  </div>

                  {/* نوع فاکتور */}
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-xs font-semibold text-slate-600">
                      نوع فاکتور
                    </label>

                    <select
                      className="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              p-2
              text-right
              text-sm
              outline-none
              focus:border-sky-500
              focus:ring-2
              focus:ring-sky-100
            "
                      value={typeactiveTab}
                      onChange={(e) =>
                        setTypeActiveTab(e.target.value as InvoiceTypeFilter)
                      }
                    >
                      <option value="all">همه</option>
                      <option value="1">نوع 1</option>
                      <option value="2">نوع 2</option>
                      <option value="5">نوع 3</option>

                      <option value="3">دانش بنیان</option>
                      <option value="4">نامشخص</option>
                    </select>
                  </div>

                  {/* نوع پرداخت */}
                  <div className="flex flex-col">
                    <label className="mb-1.5 text-xs font-semibold text-slate-600">
                      نوع پرداخت
                    </label>

                    <select
                      className="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              p-2
              text-right
              text-sm
              outline-none
              focus:border-sky-500
              focus:ring-2
              focus:ring-sky-100
            "
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                    >
                      <option value="">همه</option>
                      <option value="0">چک</option>
                      <option value="1">نقدی</option>
                      <option value="2">کارتخوان</option>
                    </select>
                  </div>

                  {/* فیلدهای جستجو */}
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
                      <label className="mb-1.5 text-xs font-semibold text-slate-600">
                        {placeholder.split(" (")[0]}
                      </label>

                      <input
                        className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                p-2
                text-right
                text-sm
                outline-none
                transition

                placeholder:text-slate-400

                focus:border-sky-500
                focus:ring-2
                focus:ring-sky-100
              "
                        placeholder={placeholder}
                        value={filters[key as keyof typeof filters]}
                        onChange={(e) => handleInputChange(key, e)}
                        onKeyDown={handleInputKeyDown}
                      />
                    </div>
                  ))}
                </div>
              </div>
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

          <div className="mb-4 flex items-center justify-end">
            <div
              onClick={() => {
                if (filteredPayments.length === 0) return;

                if (areAllSelected) {
                  deselectAllPayments();
                } else {
                  selectAllPayments();
                }
              }}
              className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 ${
                filteredPayments.length === 0
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : areAllSelected
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-sky-50 text-sky-600 hover:bg-sky-100"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                  areAllSelected
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-sky-500"
                }`}
              >
                {areAllSelected && "✓"}
              </span>

              <span>{areAllSelected ? "لغو انتخاب همه" : "انتخاب همه"}</span>
            </div>
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
