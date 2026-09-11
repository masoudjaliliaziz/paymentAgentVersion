import React, {
  useState,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import uuidv4 from "../utils/createGuid";

import { handleAddItem } from "../api/addData";
import { FileUploader, type FileUploaderHandle } from "./FileUploader";

import { useCustomers } from "../hooks/useCustomerData";
import { loadPayment } from "../api/getData";
import type { PaymentType } from "../types/apiTypes";
import toast from "react-hot-toast";

import type { CustomerType } from "../types/apiTypes";
import { Error as ErrorComponent } from "./Error";
import { extractAccountFromBankValue } from "../utils/extractAccountFromBankValue";
import NationalIdTypeDropdown from "./NationalIdTypeDropdown";

import CashReseanComponent from "./CashReseanComponent";

const bankOptions = [
  {
    value: "پاسارگاد 1-10706567-110-284 پاسداران - جاري",
    label: "پاسارگاد - پاسداران",
  },
  { value: "تجارت 1416066538 مرکزي ساوه - جاري", label: "تجارت - مرکزي ساوه" },
  {
    value: "صادرات 0102171481006 مرکزي ساوه - جاري",
    label: "صادرات - مرکزي ساوه",
  },
  { value: "ملت 3385356379 سروغربي- قرض الحسنه جاري", label: "ملت - سروغربي" },
  {
    value: "ملت 4621823449 مرکزي ساوه - قرض الحسنه جاري",
    label: "ملت - مرکزي ساوه",
  },
  { value: "ملي 0109821280001 پاسداران - جاري", label: "ملي - پاسداران" },
  {
    value: "پارسيان 20100943668605 بلوار پروين تهران - قرض الحسنه جاري",
    label: "پارسيان - پروين تهران",
  },
  { value: "صندوق جاويد 5026100391", label: "صندوق جاويد" },
  { value: "تجارت 1019399873 نوبنياد - جاري", label: "تجارت - نوبنياد" },
  { value: "تجارت 177001820893 درياي نور - جاري", label: "تجارت - درياي نور" },
  { value: "سامان 1-42548-40-805 - جاري", label: "سامان" },
  {
    value: "اقتصاد نوين 1-5008500-2-125 بهارستان",
    label: "اقتصاد نوين - بهارستان",
  },
  {
    value: "شهر 1001005695224 فرمانيه",
    label: "شهر - فرمانیه",
  },
  {
    value: "کارآفرين 1102730780608 تابان- جاري",
    label: "کارآفرین - تابان",
  },
  {
    value: "سرمايه 1-2532693-26-1031 کوي نصر-قرض الحسنه جاري",
    label: "سرمایه - کوی‌نصر",
  },
  {
    value: "صندوق کارآفرین امید--ساوه -IR200220350122278888888001 ",
    label: "صندوق کارآفرین امید",
  },
];

type Props = {
  parent_GUID: string;
  type: "check" | "cash" | "poz";
  formKey: number;
  setFormKey: Dispatch<SetStateAction<number>>;
  typeactiveTab: "1" | "2" | "3" | "4" | "5";
  customerData: CustomerType[];
  setTypeActiveTab: (value: "1" | "2" | "3" | "4" | "5") => void;
  // 👈 نوع فرم
  customerCodeHeader: string;
  customerNameHeader: string;
};

const UploadCheckoutForm: React.FC<Props> = ({
  parent_GUID,
  type,
  formKey,
  setFormKey,
  typeactiveTab,
  setTypeActiveTab,
  customerCodeHeader,
  customerNameHeader,
}) => {
  const [activeTab, setActiveTab] = useState<"hoghoghi" | "haghighi">(
    "hoghoghi",
  );

  const [itemGUID, setItemGUID] = useState("");
  const [dueDate, setDueDate] = useState<DateObject | null>(null);
  const [dayOfYear, setDayOfYear] = useState<string>("0");
  const [sayadiCode, setSayadiCode] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [nationalIdHoghoghi, setNationalIdHoghoghi] = useState("");
  const [sayadiError, setSayadiError] = useState<string | null>(null);
  const [price, setPriceState] = useState<number | "">("");
  const [priceCash, setPriceCashState] = useState<number | "">("");
  const [dayOfYearCash, setDayOfYearCash] = useState<string>("0");
  const [dueDateCash, setDueDateCash] = useState<DateObject | null>(null);
  const [bankName, setBankName] = useState<string>("");
  const [agentDescription, setAgentDescription] = useState<string>("");
  const [cashResean, setCashResean] = useState<string>("buyGoods");
  const [selectedCheckSayadiForCheckFori, setSelectedCheckSayadiForCheckFori] =
    useState("");
  const [pricepoz, setPricePozState] = useState<number | "">("");
  const [pozEternal, setPozExternal] = useState<number | "">("");
  const [dayOfYearPoz, setDayOfYearPoz] = useState<string>("0");
  const [dueDatePoz, setDueDatePoz] = useState<DateObject | null>(null);
  const [
    selectedCheckSerialNoForCheckFor,
    setSelectedCheckSerialNoForCheckFori,
  ] = useState("");
  const cashPic = useRef<FileUploaderHandle | null>(null);
  const checkPic = useRef<FileUploaderHandle | null>(null);
  const pozPic = useRef<FileUploaderHandle | null>(null);
  const checkConfirmPic = useRef<FileUploaderHandle | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: customerData } = useCustomers(parent_GUID);
  const { data: paymentList = [] } = useQuery<PaymentType[]>({
    queryKey: ["payments", parent_GUID],
    queryFn: async () => {
      const data = await loadPayment(parent_GUID);
      return (data as (PaymentType | undefined)[]).filter(
        (item): item is PaymentType => item !== undefined,
      );
    },
    enabled: !!parent_GUID,
  });
  const availableChecks = paymentList.filter(
    (p) => p.status === "4" && p.sayadiCode,
  );

  const originalCheck = paymentList.find(
    (p) => p.sayadiCode === selectedCheckSayadiForCheckFori,
  );

  const usedAmountForCheck = paymentList
    .filter(
      (p) =>
        p.selectedCheckSayadiForCheckFori === selectedCheckSayadiForCheckFori &&
        (p.status === "1" || p.status === "4"),
    )
    .reduce((sum, item) => sum + Number(item.price || 0), 0);

  const originalCheckAmount = Number(originalCheck?.price || 0);

  const remainingAmount = originalCheckAmount - usedAmountForCheck;

  const [customer, setCustomer] = useState<CustomerType>();
  useEffect(() => {
    console.log("cashResean 🧨🧨🧨🧨", cashResean);
  }, [cashResean]);
  // محاسبه باقی‌مانده بدهی
  // const [remainingDebt, setRemainingDebt] = useState<number>(0);

  // Fallback value اگر API کار نکرد
  // const FALLBACK_DEBT = 1000000; // 1 میلیون ریال

  // محاسبه باقی‌مانده بدهی
  // useEffect(() => {
  //   const fetchRemainingDebt = async () => {
  //     if (!customer?.CustomerCode) {
  //       setRemainingDebt(0);
  //       return;
  //     }

  //     try {
  //       const debt = await getRemainingDebt(customer.CustomerCode);
  //       setRemainingDebt(debt);
  //     } catch (error) {
  //       console.error("Error fetching remaining debt:", error);
  //       setRemainingDebt(FALLBACK_DEBT);
  //     }
  //   };

  //   fetchRemainingDebt();
  // }, [customer?.CustomerCode]);

  useEffect(() => {
    if (customerData !== undefined) {
      setCustomer(customerData["0"]);
    }
  }, [customerData]);

  useEffect(() => {
    setItemGUID(uuidv4());
  }, [formKey]);

  // محاسبه مجموع پرداخت‌های نوع ۲
  // const totalType2Payments = paymentList.reduce((sum, payment) => {
  //   if (payment.invoiceType === "2") {
  //     return sum + Number(payment.price || 0);
  //   }
  //   return sum;
  // }, 0);

  useEffect(() => {
    if (qrInputRef.current) qrInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!sayadiCode.trim()) {
      setSayadiError(null);
      return;
    }
    if (
      paymentList.some(
        (p) =>
          p.sayadiCode === sayadiCode.trim() &&
          p.status !== "3" &&
          p.status !== "2",
      )
    ) {
      setSayadiError("این شناسه صیادی قبلاً ثبت شده است.");
    } else {
      setSayadiError(null);
    }
  }, [sayadiCode, paymentList]);

  const validateFields = () => {
    console.log("🔴 VALIDATE TYPE:", type);
    console.log("🔴 cashResean:", cashResean);
    if (type === "check") {
      if (!sayadiCode.trim()) return "شناسه صیادی وارد نشده است.";
      if (sayadiError) return sayadiError;

      if (!dueDate) return "تاریخ سررسید انتخاب نشده است.";
      if (!price || price === 0) return "مبلغ وارد نشده است.";

      if (!checkPic.current?.hasFile?.()) return "تصویر چک الزامی است.";
      //       if (cashResean === "checkFori" && selectedCheckSayadiForCheckFori) {
      //         const enteredAmount = Number(priceCash || 0);

      //         if (enteredAmount > remainingAmount) {
      //           return `مبلغ وارد شده بیشتر از باقیمانده چک است.
      // باقیمانده قابل استفاده: ${remainingAmount.toLocaleString("fa-IR")} ریال`;
      //         }
      //       }
      if (
        cashResean === "checkFori" &&
        !selectedCheckSerialNoForCheckFor.trim()
      ) {
        return "انتخاب شماره چک برگشتی الزامی است.";
      }

      if (
        cashResean === "checkFori" &&
        !selectedCheckSayadiForCheckFori.trim()
      ) {
        return "شماره چک واردشده در لیست چک‌های برگشتی معتبر نیست.";
      }
    }

    if (type === "cash") {
      if (!bankName.trim()) return "نام بانک وارد نشده است.";
      if (!dueDateCash) return "تاریخ سررسید انتخاب نشده است.";
      if (!priceCash || priceCash === 0) return "مبلغ وارد نشده است.";

      if (!cashPic.current?.hasFile?.()) return "تصویر رسید نقدی الزامی است.";
      //       if (cashResean === "checkFori" && selectedCheckSayadiForCheckFori) {
      //         const enteredAmount = Number(priceCash || 0);

      //         if (enteredAmount > remainingAmount) {
      //           return `مبلغ وارد شده بیشتر از باقیمانده چک است.
      // باقیمانده قابل استفاده: ${remainingAmount.toLocaleString("fa-IR")} ریال`;
      //         }
      //       }
      if (
        cashResean === "checkFori" &&
        !selectedCheckSerialNoForCheckFor.trim()
      ) {
        return "انتخاب شماره چک برگشتی الزامی است.";
      }

      if (
        cashResean === "checkFori" &&
        !selectedCheckSayadiForCheckFori.trim()
      ) {
        return "شماره چک واردشده در لیست چک‌های برگشتی معتبر نیست.";
      }
    }
    if (type === "poz") {
      if (!pozEternal || pozEternal === 0)
        return " شماره پایانه وارد نشده است.";
      if (!dueDatePoz) return "تاریخ سررسید انتخاب نشده است.";
      if (!pricepoz || pricepoz === 0) return "مبلغ وارد نشده است.";
    }

    return null;
  };

  const mutation = useMutation({
    mutationFn: async ({ itemGUID }: { itemGUID: string }) => {
      // حالا داخل این تابع از itemGUID جدید استفاده می کنیم
      const error = validateFields();
      if (error) {
        toast.error(error);
        throw new Error(error);
      }

      // بررسی محدودیت Remain_Price برای نوع ۲
      // if (typeactiveTab === "2") {
      //   const currentPaymentAmount =
      //     type === "check" ? Number(price || 0) : Number(priceCash || 0);
      //   const totalType2PaymentsValue = totalType2Payments || 0;
      //   // const remainingDebtValue = remainingDebt || 0;
      //   // const totalAfterPayment =
      //   //   totalType2PaymentsValue + currentPaymentAmount;

      //   // if (totalAfterPayment > remainingDebtValue && remainingDebtValue > 0) {
      //   //   toast.error(
      //   //     `مجموع پرداخت‌ها (${totalAfterPayment.toLocaleString(
      //   //       "fa-IR"
      //   //     )} ریال) نمی‌تواند از باقی‌مانده بدهی (${remainingDebtValue.toLocaleString(
      //   //       "fa-IR"
      //   //     )} ریال) بیشتر باشد.`
      //   //   );
      //   //   throw new Error("Total payments exceed remaining debt");
      //   // }
      // }

      let data = {} as {
        price: string;
        dueDate: string;
        nationalId?: string;
        nationalIdHoghoghi?: string;
        parentGUID: string;
        dayOfYear: string;
        itemGUID: string;
        sayadiCode?: string;
        SalesExpertAcunt_text: string;
        SalesExpert: string;
        status: string;
        cash: string;
        bankName?: string;
        Verified?: string;
        VerifiedHoghoghi?: string;
        invoiceType: "1" | "2" | "3" | "4" | "5";
        customerCode: string;
        customerTitle: string;
        customerCodeHeader: string;
        customerNameHeader: string;
        cashResean?: string;
        agentDescription?: string;
        selectedCheckSayadiForCheckFori?: string;
        selectedCheckSerialNoForCheckFor?: string;
        pozExternal?: string;
      };

      if (type === "check" && activeTab === "haghighi") {
        data = {
          price: price ? price.toString() : "",
          dueDate: dueDate?.format("YYYY/MM/DD") || "",
          dayOfYear,
          sayadiCode: sayadiCode.trim(),
          nationalId,
          parentGUID: parent_GUID,
          itemGUID,
          SalesExpert: customerData?.["0"]?.SalesExpert || "",
          SalesExpertAcunt_text:
            customerData?.["0"]?.SalesExpertAcunt_text || "",
          status: "1",
          cash: "0",
          Verified: "0",
          invoiceType: typeactiveTab,
          customerCode: customer?.CustomerCode || "",
          customerTitle: customer?.Title || "",
          customerCodeHeader,
          customerNameHeader,
          agentDescription,
          selectedCheckSayadiForCheckFori,
          cashResean: cashResean,
          selectedCheckSerialNoForCheckFor,
        };
      } else if (type === "check" && activeTab === "hoghoghi") {
        data = {
          price: price ? price.toString() : "",
          dueDate: dueDate?.format("YYYY/MM/DD") || "",
          dayOfYear,
          sayadiCode: sayadiCode.trim(),
          nationalIdHoghoghi,
          parentGUID: parent_GUID,
          itemGUID,
          SalesExpert: customerData?.["0"]?.SalesExpert || "",
          SalesExpertAcunt_text:
            customerData?.["0"]?.SalesExpertAcunt_text || "",
          status: "1",
          cash: "0",
          Verified: "0",
          invoiceType: typeactiveTab,
          customerCode: customer?.CustomerCode || "",
          customerTitle: customer?.Title || "",
          customerCodeHeader,
          customerNameHeader,
          agentDescription,
          selectedCheckSayadiForCheckFori,
          cashResean: cashResean,
          selectedCheckSerialNoForCheckFor,
        };
      } else if (type === "poz") {
        data = {
          price: pricepoz ? pricepoz.toString() : "",
          dueDate: dueDatePoz?.format("YYYY/MM/DD") || "",
          dayOfYear: dayOfYearPoz,
          parentGUID: parent_GUID,
          itemGUID,
          SalesExpert: customerData?.["0"]?.SalesExpert || "",
          SalesExpertAcunt_text:
            customerData?.["0"]?.SalesExpertAcunt_text || "",
          status: "0",
          cash: "2",
          pozExternal: pozEternal.toString() || undefined,
          invoiceType: typeactiveTab,
          customerCode: customer?.CustomerCode || "",
          customerTitle: customer?.Title || "",
          customerCodeHeader,
          customerNameHeader,
          cashResean: cashResean,
          agentDescription,
        };
      } else {
        data = {
          price: priceCash ? priceCash.toString() : "",
          dueDate: dueDateCash?.format("YYYY/MM/DD") || "",
          dayOfYear: dayOfYearCash,
          parentGUID: parent_GUID,
          itemGUID,
          SalesExpert: customerData?.["0"]?.SalesExpert || "",
          SalesExpertAcunt_text:
            customerData?.["0"]?.SalesExpertAcunt_text || "",
          status: "1",
          cash: "1",
          bankName,
          invoiceType: typeactiveTab,
          customerCode: customer?.CustomerCode || "",
          customerTitle: customer?.Title || "",
          customerCodeHeader,
          customerNameHeader,
          cashResean: cashResean,
          agentDescription,
          selectedCheckSayadiForCheckFori,
          selectedCheckSerialNoForCheckFor,
        };
      }
      console.log("🎶🎶🎶🎶🎶🎶🎶🎶", data);
      await handleAddItem(data);

      setTypeActiveTab("1");

      if (type === "cash") {
        if (cashPic.current) await cashPic.current.uploadFile();
      }
      if (type === "poz") {
        if (pozPic.current) await pozPic.current.uploadFile();
      }
      if (type === "check") {
        if (checkPic.current) await checkPic.current.uploadFile();
        if (checkConfirmPic.current?.hasFile?.()) {
          await checkConfirmPic.current.uploadFile();
        }
      }
    },
    onSuccess: () => {
      if (type === "cash") {
        setPriceCashState("");
        setDueDateCash(null);
        setBankName("");
        cashPic.current?.clearFile?.();
      }
      if (type === "poz") {
        setPricePozState("");
        setDueDatePoz(null);
        setPozExternal("");
        pozPic.current?.clearFile?.();
      }
      setFormKey((cur) => cur + 1);
      toast.success("ثبت با موفقیت انجام شد");

      queryClient.invalidateQueries({ queryKey: ["paymentsDraft"] });

      checkPic.current?.clearFile?.();
      checkConfirmPic.current?.clearFile?.();

      setPriceState("");
      setDueDate(null);
      setSayadiCode("");
      setNationalId("");
      setSayadiError(null);
    },
    onError: (error) => {
      toast.error("خطا در ثبت فرم");
      console.error("خطا:", error);
    },
  });

  if (customerData?.length === 0 || customerData === undefined) {
    <ErrorComponent title="خطا در یافتن مشتری یا مشتری در crm وجود ندارد" />;
  }

  const formatNumber = (num: number | "") =>
    num === "" ? "" : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const parseNumber = (str: string): number | "" => {
    const cleaned = str.replace(/,/g, "");
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? "" : parsed;
  };

  function getOwnerNationalId(str: string, activeTab: "haghighi" | "hoghoghi") {
    if (!str.includes("IR")) return "";
    const parts = str.split("IR");
    if (
      parts.length < 2 ||
      parts[0].length < (activeTab === "haghighi" ? 10 : 11)
    )
      return "";
    return parts[0].slice(activeTab === "haghighi" ? -10 : -11);
  }

  const handleQRCodeInput = (
    e: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => {
    e.preventDefault();
    setSayadiCode(getLast16Chars(value));
    const national = getOwnerNationalId(value, activeTab);
    if (activeTab === "haghighi" && national.length === 10) {
      setNationalId(national);
    } else if (activeTab === "hoghoghi" && national.length === 11) {
      setNationalIdHoghoghi(national);
    }
  };
  function getLast16Chars(str: string) {
    return str.slice(-16);
  }
  return (
    <div className="mb-6 w-full text-base-content">
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ================= HEADER ================= */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* عنوان */}
            <div className="flex items-center gap-2">
              {type === "check" && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary-600" />
              )}
              {type === "poz" && (
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
              )}
              {type === "cash" && (
                <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
              )}

              <span className="text-base font-bold text-slate-800 sm:text-lg">
                {type === "check"
                  ? "ثبت چک جدید"
                  : type === "poz"
                    ? "ثبت کارتخوان"
                    : "ثبت واریز نقدی"}
              </span>
            </div>

            {/* کنترل‌های Header */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {/* نوع پرداخت */}
              <div className="w-full sm:w-48">
                <CashReseanComponent
                  value={cashResean}
                  onChange={setCashResean}
                />
              </div>

              {/* نوع شخص / شرکت */}
              {type === "check" && (
                <div className="w-full sm:w-48">
                  <NationalIdTypeDropdown
                    value={activeTab}
                    onChange={setActiveTab}
                    className="dropdown-end"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="space-y-4 p-4 sm:p-5 lg:p-6">
          {/* ===================================================== */}
          {/* ======================= CHECK ======================= */}
          {/* ===================================================== */}

          {type === "check" && (
            <>
              {/* کد صیادی */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    کد صیادی
                  </label>

                  <input
                    ref={qrInputRef}
                    type="text"
                    value={sayadiCode}
                    onChange={(e) => handleQRCodeInput(e, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                    className={`input input-bordered w-full bg-white font-mono text-sm ltr ${
                      sayadiError
                        ? "input-error border-red-600"
                        : "border-slate-300"
                    }`}
                    placeholder="اسکن یا وارد کردن کد صیادی"
                  />
                </div>
              </div>

              {/* انتخاب چک */}
              {cashResean === "checkFori" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-sm font-bold text-slate-700">
                      انتخاب چک (شماره چک)
                    </label>

                    <input
                      type="text"
                      list="check-serial-list"
                      value={selectedCheckSerialNoForCheckFor}
                      onChange={(e) => {
                        const serialNo = e.target.value.trim();

                        setSelectedCheckSerialNoForCheckFori(serialNo);

                        const selectedCheck = availableChecks.find(
                          (check) =>
                            String(check.serialNo ?? "").trim() === serialNo,
                        );

                        setSelectedCheckSayadiForCheckFori(
                          String(selectedCheck?.sayadiCode ?? ""),
                        );
                      }}
                      placeholder="جستجو یا انتخاب شماره چک"
                      className="input input-bordered w-full bg-white font-mono text-sm ltr"
                    />

                    <datalist id="check-serial-list">
                      {availableChecks.map((item) => (
                        <option key={item.itemGUID} value={item.serialNo}>
                          {item.serialNo}
                        </option>
                      ))}
                    </datalist>

                    {selectedCheckSayadiForCheckFori && (
                      <div className="w-full rounded-lg border border-amber-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                        <span>کد صیادی:</span>{" "}
                        <span className="font-mono ltr">
                          {selectedCheckSayadiForCheckFori}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* کد ملی */}
              {activeTab === "haghighi" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-sm font-bold text-slate-700">
                      کد ملی صاحب چک
                    </label>

                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNationalId(e.target.value);
                      }}
                      minLength={10}
                      maxLength={11}
                      placeholder="مثلاً: 1234567890"
                      className="input input-bordered w-full bg-white font-mono text-sm ltr"
                    />
                  </div>
                </div>
              )}

              {/* شناسه ملی */}
              {activeTab === "hoghoghi" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-sm font-bold text-slate-700">
                      شناسه ملی شرکت
                    </label>

                    <input
                      type="text"
                      value={nationalIdHoghoghi}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNationalIdHoghoghi(e.target.value);
                      }}
                      minLength={10}
                      maxLength={11}
                      placeholder="مثلاً: 1234567890"
                      className="input input-bordered w-full bg-white font-mono text-sm ltr"
                    />
                  </div>
                </div>
              )}

              {/* مبلغ */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    مبلغ (ریال)
                  </label>

                  <input
                    type="text"
                    value={formatNumber(price)}
                    onChange={(e) => setPriceState(parseNumber(e.target.value))}
                    className="input input-bordered w-full bg-white font-semibold"
                    placeholder="مثال: 1,500,000"
                  />

                  {cashResean === "checkFori" &&
                    selectedCheckSayadiForCheckFori && (
                      <div className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-600">
                        <div>
                          مبلغ چک:{" "}
                          <span className="font-bold">
                            {originalCheckAmount.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>

                        <div>
                          استفاده شده:{" "}
                          <span className="font-bold">
                            {usedAmountForCheck.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>

                        <div className="font-semibold text-green-600">
                          باقیمانده:{" "}
                          <span className="font-bold">
                            {remainingAmount.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* تاریخ */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    تاریخ سررسید
                  </label>

                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={dueDate}
                    onChange={(date: DateObject | null) => {
                      if (date) {
                        setDueDate(date);
                        setDayOfYear(String(date.dayOfYear ?? 0));
                      }
                    }}
                    inputClass="input input-bordered w-full bg-white"
                    placeholder="تاریخ را انتخاب کنید"
                    format="YYYY/MM/DD"
                  />
                </div>
              </div>

              {/* توضیحات */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    توضیحات
                  </label>

                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    rows={4}
                    placeholder="توضیحات اختیاری"
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-end text-sm font-semibold outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {/* آپلود */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <FileUploader
                    ref={checkPic}
                    orderNumber={parent_GUID}
                    subFolder={itemGUID}
                    title="تصویر چک (الزامی)"
                    inputId="file-upload-check-pic"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <FileUploader
                    ref={checkConfirmPic}
                    orderNumber={parent_GUID}
                    subFolder={itemGUID}
                    title="رسید ثبت چک (اختیاری)"
                    inputId="file-upload-check-confirm"
                  />
                </div>
              </div>

              {/* ثبت */}
              <button
                type="button"
                onClick={() => {
                  mutation.mutate({ itemGUID });
                }}
                disabled={mutation.isPending}
                className={`flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  mutation.isPending
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-primary-500"
                }`}
              >
                {mutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    در حال ثبت...
                  </div>
                ) : (
                  "ثبت چک"
                )}
              </button>
            </>
          )}

          {/* ===================================================== */}
          {/* ======================= CASH ======================== */}
          {/* ===================================================== */}

          {type === "cash" && (
            <>
              {/* انتخاب چک در واریز */}
              {cashResean === "checkFori" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-sm font-bold text-slate-700">
                      انتخاب چک (شماره چک)
                    </label>

                    <input
                      type="text"
                      list="check-serial-list"
                      value={selectedCheckSerialNoForCheckFor}
                      onChange={(e) => {
                        const serialNo = e.target.value.trim();

                        setSelectedCheckSerialNoForCheckFori(serialNo);

                        const selectedCheck = availableChecks.find(
                          (check) =>
                            String(check.serialNo ?? "").trim() === serialNo,
                        );

                        setSelectedCheckSayadiForCheckFori(
                          String(selectedCheck?.sayadiCode ?? ""),
                        );
                      }}
                      placeholder="جستجو یا انتخاب شماره چک"
                      className="input input-bordered w-full bg-white font-mono text-sm ltr"
                    />

                    <datalist id="check-serial-list">
                      {availableChecks.map((item) => (
                        <option key={item.itemGUID} value={item.serialNo}>
                          {item.serialNo}
                        </option>
                      ))}
                    </datalist>

                    {selectedCheckSayadiForCheckFori && (
                      <p className="w-full text-xs font-semibold text-slate-500 ltr">
                        کد صیادی: {selectedCheckSayadiForCheckFori}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* بانک */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    نام بانک مقصد
                  </label>

                  <select
                    className="select select-bordered w-full bg-white text-right"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="">بانک را انتخاب کنید</option>

                    {bankOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {bankName && (
                    <div className="w-full rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-center text-xs font-bold text-slate-500">
                        شماره حساب بانک انتخاب شده
                      </div>

                      <div className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-700 ltr">
                        {extractAccountFromBankValue(bankName)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* تاریخ واریز */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    تاریخ واریز
                  </label>

                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={dueDateCash}
                    onChange={(date: DateObject | null) => {
                      if (date) {
                        setDueDateCash(date);
                        setDayOfYearCash(String(date.dayOfYear ?? 0));
                      }
                    }}
                    inputClass="input input-bordered w-full bg-white"
                    placeholder="تاریخ را انتخاب کنید"
                    format="YYYY/MM/DD"
                    maxDate={new DateObject()}
                  />
                </div>
              </div>

              {/* مبلغ */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    مبلغ (ریال)
                  </label>

                  <input
                    type="text"
                    value={formatNumber(priceCash)}
                    onChange={(e) =>
                      setPriceCashState(parseNumber(e.target.value))
                    }
                    className="input input-bordered w-full bg-white font-semibold"
                    placeholder="مثال: 1,500,000"
                  />

                  {cashResean === "checkFori" &&
                    selectedCheckSayadiForCheckFori && (
                      <div className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-600">
                        <div>
                          مبلغ چک:{" "}
                          <span className="font-bold">
                            {originalCheckAmount.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>

                        <div>
                          استفاده شده:{" "}
                          <span className="font-bold">
                            {usedAmountForCheck.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>

                        <div className="font-semibold text-green-600">
                          باقیمانده:{" "}
                          <span className="font-bold">
                            {remainingAmount.toLocaleString("fa-IR")} ریال
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* توضیحات */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    توضیحات
                  </label>

                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    rows={4}
                    placeholder="توضیحات اختیاری"
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-end text-sm font-semibold outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {/* آپلود فیش */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <FileUploader
                  ref={cashPic}
                  orderNumber={parent_GUID}
                  subFolder={itemGUID}
                  title="تصویر فیش واریزی (الزامی)"
                  inputId="file-upload-cash-pic"
                />
              </div>

              {/* ثبت */}
              <button
                type="button"
                onClick={() => {
                  mutation.mutate({ itemGUID });
                }}
                disabled={mutation.isPending}
                className={`flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  mutation.isPending
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-primary-500"
                }`}
              >
                {mutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    در حال ثبت...
                  </div>
                ) : (
                  "ثبت واریز"
                )}
              </button>
            </>
          )}

          {type === "poz" && (
            <>
              {/* ================= شماره پایانه ================= */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    شماره پایانه
                  </label>

                  <input
                    type="text"
                    value={formatNumber(pozEternal)}
                    onChange={(e) =>
                      setPozExternal(parseNumber(e.target.value))
                    }
                    className="input input-bordered w-full bg-white font-semibold"
                    placeholder="مثلاً: 123456789"
                  />
                </div>
              </div>

              {/* ================= تاریخ واریز ================= */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    تاریخ واریز
                  </label>

                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={dueDatePoz}
                    onChange={(date: DateObject | null) => {
                      if (date) {
                        setDueDatePoz(date);
                        setDayOfYearPoz(String(date.dayOfYear ?? 0));
                      }
                    }}
                    inputClass="input input-bordered w-full bg-white"
                    placeholder="تاریخ را انتخاب کنید"
                    format="YYYY/MM/DD"
                    maxDate={new DateObject()}
                  />
                </div>
              </div>

              {/* ================= مبلغ ================= */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    مبلغ (ریال)
                  </label>

                  <input
                    type="text"
                    value={formatNumber(pricepoz)}
                    onChange={(e) =>
                      setPricePozState(parseNumber(e.target.value))
                    }
                    className="input input-bordered w-full bg-white font-semibold"
                    placeholder="مثال: 1,500,000"
                  />
                </div>
              </div>

              {/* ================= توضیحات ================= */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-bold text-slate-700">
                    توضیحات
                  </label>

                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    rows={4}
                    placeholder="توضیحات اختیاری"
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-end text-sm font-semibold outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {/* ================= آپلود فیش ================= */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <FileUploader
                  ref={pozPic}
                  orderNumber={parent_GUID}
                  subFolder={itemGUID}
                  title="تصویر فیش واریزی (الزامی)"
                  inputId="file-upload-poz-pic"
                />
              </div>

              {/* ================= ثبت ================= */}
              <button
                type="button"
                onClick={() => {
                  if (mutation.isPending) return;

                  mutation.mutate({ itemGUID });
                }}
                disabled={mutation.isPending}
                className={`flex min-h-11 w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  mutation.isPending
                    ? "cursor-not-allowed bg-slate-300 text-slate-500"
                    : "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md focus:ring-primary-500"
                }`}
              >
                {mutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    در حال ثبت...
                  </div>
                ) : (
                  "ثبت"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadCheckoutForm;
