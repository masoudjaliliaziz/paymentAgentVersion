import { useEffect, useState, useMemo } from "react";
import { setPayments, setUser, setUserRole } from "./store/agentSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store/store";
import { useUserRoles } from "./hooks/useUserRoles";
// import { calculateRasDatePayment } from "./utils/calculateRasDate";
// import { getShamsiDateFromDayOfYear } from "./utils/getShamsiDateFromDayOfYear";
import type { PaymentType } from "./types/apiTypes";
import { useAllPayment } from "./hooks/useAllPayments";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  FileTerminal,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useCurrentUser } from "./hooks/useUser";
import { exportToExcel } from "./utils/exportToExcel";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { BankFilter } from "./components/BankFilter";
import { getBankNameFromIBAN } from "./utils/getBankNameFromIban";
import { PaymentRowMorad } from "./components/morad/PaymentRowMorad";

const specialUsers = [
  "i:0#.w|zarsim\\rashaadmin",
  "i:0#.w|zarsim\\mesmaeili",
  "i:0#.w|zarsim\\m.esmaeili",
  "i:0#.w|zarsim\\mmoradabadi",
  "i:0#.w|zarsim\\rparsaei",
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
  const [shownUnprocessedChecks, setShownUnprocessedChecks] =
    useState<boolean>(true); // Default to true for unprocessed checks
  const [completedVerifications, setCompletedVerifications] = useState<
    string[]
  >([]);
  useEffect(() => {
    console.log("14041020".slice(6, 8));
  }, []);
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
  // const [selectedRasDate, setSelectedRasDate] = useState<number | null>(null);
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

  const togglePaymentSelection = (payment: PaymentType) => {
    setSelectedPayments((prev) => {
      const exists = prev.find((p) => p.ID === payment.ID);
      return exists
        ? prev.filter((p) => p.ID !== payment.ID)
        : [...prev, payment];
    });
  };

  // useEffect(() => {
  //   if (selectedPayments.length > 0) {
  //     const calculated = calculateRasDatePayment(selectedPayments);
  //     setSelectedRasDate(calculated);
  //   } else {
  //     setSelectedRasDate(null);
  //   }
  // }, [selectedPayments]);

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

  // تابع تبدیل تاریخ شمسی به فرمت YYYYMMDD برای مقایسه
  const normalizeDateForComparison = (
    dateString: string | undefined | null,
    convertGregorianToShamsi: boolean = false
  ): string | null => {
    if (!dateString || typeof dateString !== "string") {
      return null;
    }

    // اگر ورودی میلادی بود و باید به شمسی تبدیل شود
    if (convertGregorianToShamsi) {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        try {
          const persianDate = new DateObject(parsed).convert(persian);
          const year = String(persianDate.year);
          const month = String(persianDate.month).padStart(2, "0");
          const day = String(persianDate.day).padStart(2, "0");
          return `${year}${month}${day}`;
        } catch (error) {
          console.warn("خطا در تبدیل تاریخ میلادی به شمسی:", error);
        }
      }
    }

    // تبدیل اعداد فارسی به انگلیسی
    const persianToEnglishDigits = (str: string) =>
      str.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728));

    const normalized = persianToEnglishDigits(dateString).replace(
      /[^0-9]/g,
      ""
    );

    // اگر تاریخ به فرمت YYYYMMDD باشد
    if (/^\d{8}$/.test(normalized)) {
      return normalized;
    }

    // اگر تاریخ به فرمت YYYY/MM/DD یا YYYY-MM-DD باشد
    if (normalized.length >= 8) {
      return normalized.slice(0, 8);
    }

    return null;
  };

  // تابع بررسی اینکه آیا تاریخ در بازه مشخص شده است
  const isDateInRange = (
    targetDate: string | undefined | null,
    range: DateObject[],
    convertGregorianToShamsi: boolean = false
  ): boolean => {
    if (!range || !Array.isArray(range) || range.length === 0) {
      return true; // اگر بازه تاریخ انتخاب نشده باشد، همه را نشان بده
    }

    const normalizedTargetDate = normalizeDateForComparison(
      targetDate,
      convertGregorianToShamsi
    );
    if (!normalizedTargetDate) {
      return false;
    }

    // تبدیل تاریخ‌های انتخاب شده به فرمت YYYYMMDD
    const dates = range
      .map((date) => {
        if (date instanceof DateObject) {
          const year = String(date.year);
          const month = String(date.month).padStart(2, "0");
          const day = String(date.day).padStart(2, "0");
          return `${year}${month}${day}`;
        }
        return null;
      })
      .filter((d): d is string => d !== null);

    if (dates.length === 0) {
      return true;
    }

    if (dates.length === 1) {
      // اگر فقط یک تاریخ انتخاب شده، همان تاریخ را فیلتر کن
      return normalizedTargetDate === dates[0];
    }

    // اگر دو تاریخ انتخاب شده، بازه را بررسی کن
    const [startDate, endDate] = dates.sort();
    return normalizedTargetDate >= startDate && normalizedTargetDate <= endDate;
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
      } else if (key === "Title") {
        // Sort based on customer title from customerTitles map
        const titleA = customerTitles.get(a.parentGUID) ?? "";
        const titleB = customerTitles.get(b.parentGUID) ?? "";
        return sortConfig.direction === "asc"
          ? titleA.localeCompare(titleB, "fa")
          : titleB.localeCompare(titleA, "fa");
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
    invoiceType: "", // فیلتر نوع فاکتور (1 یا 2)
  });
  const [dateRange, setDateRange] = useState<DateObject[]>([]); // بازه تاریخ برای فیلتر
  const [createdDateRange, setCreatedDateRange] = useState<DateObject[]>([]); // بازه تاریخ ثبت چک
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]); // فیلتر بانک‌ها
  const [paymentType, setPaymentType] = useState<string>(""); // فیلتر نوع پرداخت: "" = همه، "0" = چک، "1" = نقدی

  const filteredPayments =
    paymentData
      ?.filter((item) => {
        // Special users can see all payments regardless of status
        if (userData && specialUsers.includes(userData)) {
          return true;
        }

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
        // Special users can see all payments regardless of SalesExpertAcunt_text
        if (userData && specialUsers.includes(userData)) {
          return true;
        }
        if (userData) {
          return item.SalesExpertAcunt_text === userData;
        }
        return false;
      })
      .filter((item) => {
        // فیلتر بازه تاریخ
        if (!isDateInRange(item.dueDate, dateRange)) {
          return false;
        }

        // فیلتر بازه تاریخ ثبت
        if (!isDateInRange(item.Created, createdDateRange, true)) {
          return false;
        }

        // فیلترهای دیگر
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === "Title") {
            const title = customerTitles.get(item.parentGUID) ?? "";
            return title.toLowerCase().includes(value.toLowerCase());
          }
          if (key === "invoiceType") {
            // فیلتر بر اساس نوع فاکتور
            return String(item.invoiceType) === value;
          }
          return (item[key as keyof PaymentType] ?? "")
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        });
      }) ?? [];

  const sortedPayments = sortPayments(filteredPayments);

  // استخراج لیست منحصر به فرد نام بانک‌ها از پرداخت‌ها
  const uniqueBanks = useMemo(() => {
    const banksSet = new Set<string>();
    if (Array.isArray(paymentData)) {
      paymentData.forEach((payment) => {
        if (payment.cash === "0" && payment.iban) {
          const bankName = getBankNameFromIBAN(payment.iban);
          if (bankName && bankName !== "شماره شبا معتبر نیست") {
            banksSet.add(bankName);
          }
        } else if (payment.cash === "1" && payment.bankName) {
          banksSet.add(payment.bankName);
        }
      });
    }
    return Array.from(banksSet).sort();
  }, [paymentData]);

  // const totalSelectedPrice = selectedPayments.reduce(
  //   (sum, p) => sum + Number(p.price || 0),
  //   0
  // );

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

  // تابع handleExportToExcel - این تابع چک‌های فیلتر شده را به Excel export می‌کند
  const handleExportToExcel = () => {
    try {
      // استفاده از displayedPayments که چک‌های فیلتر شده فعلی را شامل می‌شود
      if (displayedPayments.length === 0) {
        alert("هیچ چکی برای export وجود ندارد!");
        return;
      }

      // فراخوانی تابع exportToExcel با چک‌های فیلتر شده
      exportToExcel(
        displayedPayments,
        `چک_های_فیلتر_شده_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      console.log(`تعداد ${displayedPayments.length} چک به Excel export شد`);
    } catch (error) {
      console.error("خطا در export به Excel:", error);
      alert("خطا در ایجاد فایل Excel. لطفاً دوباره تلاش کنید.");
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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
      setShownUnprocessedChecks(false);
    }
  };

  const toggleUnprocessedChecks = () => {
    const newState = !shownUnprocessedChecks;
    setShownUnprocessedChecks(newState);
    if (newState) {
      setShownSayadConfirmTrChecks(false);
      setShownSayadUnConfirmTrChecks(false);
      setShownConfirmTrChecks(false);
      setShownUnConfirmTrChecks(false);
    }
  };

  const getDisplayedPayments = () => {
    if (!Array.isArray(paymentData) || !Array.isArray(sortedPayments)) {
      return [];
    }

    let basePayments: PaymentType[] = [];

    if (shownSayadConfirmTrChecks) {
      basePayments =
        paymentData.filter((data) => data?.VerifiedConfirmSayadTr === "1") ??
        [];
    } else if (shownSayadUnConfirmTrChecks) {
      basePayments =
        paymentData.filter((data) => data?.VerifiedRejectSayadTr === "1") ?? [];
    } else if (shownConfirmTrChecks) {
      basePayments = paymentData.filter((data) => data?.status === "4") ?? [];
    } else if (shownUnConfirmTrChecks) {
      basePayments = paymentData.filter((data) => data?.status === "3") ?? [];
    } else if (shownUnprocessedChecks) {
      basePayments =
        sortedPayments.filter((data) => data?.status === "1") ?? [];
    } else if (isMaster) {
      basePayments = sortedPayments ?? [];
    } else {
      return [];
    }

    // Apply search filters to all payment states
    return basePayments.filter((item) => {
      // فیلتر بازه تاریخ
      if (!isDateInRange(item.dueDate, dateRange)) {
        return false;
      }

      // فیلتر بازه تاریخ ثبت
      if (!isDateInRange(item.Created, createdDateRange, true)) {
        return false;
      }

      // فیلتر نوع پرداخت
      if (paymentType !== "") {
        if (item.cash !== paymentType) {
          return false;
        }
      }

      // فیلتر بانک
      if (selectedBanks.length > 0) {
        let itemBankName = "";
        if (item.cash === "0" && item.iban) {
          itemBankName = getBankNameFromIBAN(item.iban);
        } else if (item.cash === "1" && item.bankName) {
          itemBankName = item.bankName;
        }
        if (!itemBankName || !selectedBanks.includes(itemBankName)) {
          return false;
        }
      }

      // فیلترهای دیگر
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === "Title") {
          const title = customerTitles.get(item.parentGUID) ?? "";
          return title.toLowerCase().includes(value.toLowerCase());
        }
        if (key === "invoiceType") {
          // فیلتر بر اساس نوع فاکتور
          return String(item.invoiceType) === value;
        }
        return (item[key as keyof PaymentType] ?? "")
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      });
    });
  };
  const displayedPayments = getDisplayedPayments();

  const totalSelectedPrice = selectedPayments
    .filter((p) => displayedPayments.some((dp) => dp.ID === p.ID))
    .reduce((sum, p) => sum + Number(p.price.replaceAll(",", "") || 0), 0);

  return (
    <div className="flex gap-6 mt-6 px-4">
      <div className="w-1/4 sticky top-0 self-start bg-white shadow-sm p-4 flex flex-col gap-4 border rounded-md h-fit max-h-screen overflow-y-auto">
        <div className="flex w-full items-center justify-center gap-2 flex-col">
          <div
            className={clsx(
              "p-1 rounded-md flex items-center justify-between gap-2 w-full",
              {
                "bg-green-500 text-white": shownUnprocessedChecks,
                "hover:bg-green-200 hover:text-green-800 cursor-pointer": true,
              }
            )}
            onClick={toggleUnprocessedChecks}
          >
            <Check />
            <span className="text-xs font-bold">
              چک‌های در انتظار تایید خزانه
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
          {/* <span className="text-sky-500 text-sm font-bold">
            راس پرداخت‌های انتخاب‌شده
          </span>
          <span className="text-slate-500 text-lg font-bold">
            {selectedRasDate
              ? getShamsiDateFromDayOfYear(selectedRasDate)
              : "چکی انتخاب نشده"}
          </span> */}
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
          <div className="flex flex-col">
            <label className="mb-1 text-gray-600">
              {"عنوان مشتری".split(" (")[0]}
            </label>
            <input
              className="border p-1 rounded-md"
              placeholder={"عنوان مشتری"}
              value={filters["Title" as keyof typeof filters]}
              onChange={(e) => handleInputChange("Title", e)}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          {/* فیلتر تاریخ ثبت در سیستم */}
          <div className="flex flex-col">
            <label className="mb-1 text-gray-600">بازه تاریخ ثبت چک</label>
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
              inputClass="border p-1 rounded-md w-full text-right"
              placeholder="از تاریخ ثبت - تا تاریخ ثبت"
            />
            {createdDateRange &&
              Array.isArray(createdDateRange) &&
              createdDateRange.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCreatedDateRange([])}
                  className="mt-1 text-xs text-red-600 hover:text-red-800"
                >
                  پاک کردن فیلتر تاریخ ثبت
                </button>
              )}
          </div>

          {/* فیلتر بازه تاریخ */}
          <div className="flex flex-col">
            <label className="mb-1 text-gray-600">بازه تاریخ سررسید</label>
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
              inputClass="border p-1 rounded-md w-full text-right"
              placeholder="از تاریخ - تا تاریخ"
            />
            {dateRange && Array.isArray(dateRange) && dateRange.length > 0 && (
              <button
                type="button"
                onClick={() => setDateRange([])}
                className="mt-1 text-xs text-red-600 hover:text-red-800"
              >
                پاک کردن فیلتر تاریخ
              </button>
            )}
          </div>
          {/* فیلتر نوع فاکتور */}
          <div className="flex flex-col">
            <label className="mb-1 text-gray-600">نوع فاکتور</label>
            <select
              className="border p-1 rounded-md text-right"
              value={filters.invoiceType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, invoiceType: e.target.value }))
              }
            >
              <option value="">همه</option>
              <option value="1">نوع 1</option>
              <option value="2">نوع 2</option>
              <option value="3">دانش بنیان</option>
              <option value="4">نامشخص</option>
            </select>
          </div>

          {/* فیلتر نوع پرداخت */}
          <div className="flex flex-col">
            <label className="mb-1 text-gray-600">نوع پرداخت</label>
            <select
              className="border p-1 rounded-md text-right"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="">همه</option>
              <option value="0">چک</option>
              <option value="1">نقدی</option>
            </select>
          </div>

          {/* فیلتر بانک */}
          <BankFilter
            banks={uniqueBanks}
            selectedBanks={selectedBanks}
            onSelectionChange={setSelectedBanks}
          />
        </div>
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

      <div className="w-3/4">
        {isLoading && <p>در حال بارگذاری...</p>}
        {error && <p>خطا در دریافت اطلاعات: {error.message}</p>}

        {displayedPayments.length === 0 && (
          <p>هیچ پرداختی مطابق فیلتر یافت نشد.</p>
        )}

        <div className="mb-4 flex items-center justify-between gap-4 bg-white p-2 rounded-md shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <div
              onClick={() => handleSort("price")}
              className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                sortConfig.key === "price"
                  ? sortConfig.direction === "asc"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              <span className="text-sm font-bold">مبلغ</span>
              <span className="text-sm font-bold">
                {sortConfig.key === "price" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUp size={16} className="mt-1" />
                ) : sortConfig.key === "price" &&
                  sortConfig.direction === "desc" ? (
                  <ArrowDown size={16} className="mt-1" />
                ) : (
                  <ArrowUpDown size={16} className="mt-1" />
                )}
              </span>
            </div>
            <div
              onClick={() => handleSort("dueDate")}
              className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                sortConfig.key === "dueDate"
                  ? sortConfig.direction === "asc"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              <span className="text-sm font-bold">تاریخ</span>
              <span className="text-sm font-bold">
                {sortConfig.key === "dueDate" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUp size={16} className="mt-1" />
                ) : sortConfig.key === "dueDate" &&
                  sortConfig.direction === "desc" ? (
                  <ArrowDown size={16} className="mt-1" />
                ) : (
                  <ArrowUpDown size={16} className="mt-1" />
                )}
              </span>
            </div>
            <div
              onClick={() => handleSort("Title")}
              className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                sortConfig.key === "Title"
                  ? sortConfig.direction === "asc"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              <span className="text-sm font-bold">نام مشتری</span>
              <span className="text-sm font-bold">
                {sortConfig.key === "Title" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUp size={16} className="mt-1" />
                ) : sortConfig.key === "Title" &&
                  sortConfig.direction === "desc" ? (
                  <ArrowDown size={16} className="mt-1" />
                ) : (
                  <ArrowUpDown size={16} className="mt-1" />
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={displayedPayments.length === 0}
              className={`px-4 py-2 rounded-md text-white font-semibold flex items-center gap-2 ${
                displayedPayments.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              <FileTerminal size={16} />
              <span className="text-sm font-bold">اکسل</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div
              onClick={() => {
                if (areAllSelected) {
                  deselectAllPayments();
                } else {
                  selectAllPayments();
                }
              }}
              className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
                areAllSelected ? "bg-green-500 text-white" : "bg-gray-200"
              }`}
            >
              <span className="text-sm font-bold">انتخاب همه</span>
              <span className="text-sm font-bold">
                {areAllSelected ? (
                  <Check size={16} className="mt-1" />
                ) : (
                  <ArrowUpDown size={16} className="mt-1" />
                )}
              </span>
            </div>
          </div>
        </div>

        {displayedPayments.map((item, i) => (
          <PaymentRowMorad
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
