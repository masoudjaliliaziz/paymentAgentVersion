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
  { value: "صندوق کارآفريني اميد- ساوه", label: "کارآفريني اميد - ساوه" },
  {
    value: "اقتصاد نوين 1-5008500-2-125 بهارستان",
    label: "اقتصاد نوين - بهارستان",
  },
];

type Props = {
  parent_GUID: string;
  type: "check" | "cash";
  formKey: number;
  setFormKey: Dispatch<SetStateAction<number>>;
  typeactiveTab: "1" | "2";
  customerData: CustomerType[];
  setTypeActiveTab: (value: "1" | "2") => void;
  // 👈 نوع فرم
};

const UploadCheckoutForm: React.FC<Props> = ({
  parent_GUID,
  type,
  formKey,
  setFormKey,
  typeactiveTab,
  setTypeActiveTab,
}) => {
  const [activeTab, setActiveTab] = useState<"hoghoghi" | "haghighi">(
    "hoghoghi"
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
  const cashPic = useRef<FileUploaderHandle | null>(null);
  const checkPic = useRef<FileUploaderHandle | null>(null);
  const checkConfirmPic = useRef<FileUploaderHandle | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: customerData } = useCustomers(parent_GUID);
  const { data: paymentList = [] } = useQuery<PaymentType[]>({
    queryKey: ["payments", parent_GUID],
    queryFn: async () => {
      const data = await loadPayment(parent_GUID);
      return (data as (PaymentType | undefined)[]).filter(
        (item): item is PaymentType => item !== undefined
      );
    },
    enabled: !!parent_GUID,
  });

  const [customer, setCustomer] = useState<CustomerType>();

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
          p.status !== "2"
      )
    ) {
      setSayadiError("این شناسه صیادی قبلاً ثبت شده است.");
    } else {
      setSayadiError(null);
    }
  }, [sayadiCode, paymentList]);

  const validateFields = () => {
    if (type === "check") {
      if (!sayadiCode.trim()) return "شناسه صیادی وارد نشده است.";
      if (sayadiError) return sayadiError;

      if (!dueDate) return "تاریخ سررسید انتخاب نشده است.";
      if (!price || price === 0) return "مبلغ وارد نشده است.";

      if (!checkPic.current?.hasFile?.()) return "تصویر چک الزامی است.";
    }

    if (type === "cash") {
      if (!bankName.trim()) return "نام بانک وارد نشده است.";
      if (!dueDateCash) return "تاریخ سررسید انتخاب نشده است.";
      if (!priceCash || priceCash === 0) return "مبلغ وارد نشده است.";

      if (!cashPic.current?.hasFile?.()) return "تصویر رسید نقدی الزامی است.";
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
        invoiceType: "1" | "2";
        customerCode: string;
        customerTitle: string;
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
          VerifiedHoghoghi: "0",
          invoiceType: typeactiveTab,
          customerCode: customer?.CustomerCode || "",
          customerTitle: customer?.Title || "",
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
        };
      }

      await handleAddItem(data);
      console.log("typeactiveTab:rrrrrrrrrrrrrrrrrrrrrr", typeactiveTab);
      setTypeActiveTab("1");

      if (type === "cash") {
        if (cashPic.current) await cashPic.current.uploadFile();
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
    value: string
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
    <div className="flex flex-col gap-4 mb-6 p-4 rounded-lg text-base-content">
      <div className="w-full bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xl flex flex-col gap-6 transition-all duration-300">
        {type === "check" && (
          <div className="w-full flex justify-end items-center">
            <NationalIdTypeDropdown
              value={activeTab}
              onChange={setActiveTab}
              className="dropdown-end"
            />
          </div>
        )}

        <span className="text-lg font-bold border-b pb-2 text-right">
          {type === "check" ? "ثبت چک جدید" : "ثبت واریز نقدی"}
        </span>

        {type === "check" && (
          <>
            <div className="flex flex-col gap-2 items-end ">
              <label className="text-sm font-semibold"> کد صیادی </label>
              <input
                ref={qrInputRef}
                type="text"
                value={sayadiCode}
                onChange={(e) => handleQRCodeInput(e, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // جلوگیری از رفرش یا ارسال فرم
                  }
                }}
                className={`input input-bordered w-full font-mono text-sm ltr ${
                  sayadiError ? "input-error border-red-600" : ""
                }`}
                placeholder="اسکن یا وارد کردن کد صیادی"
              />
            </div>

            {activeTab === "haghighi" && (
              <div className="flex flex-col gap-2 items-end ">
                <label className="text-sm font-semibold">کد ملی صاحب چک</label>
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
                  className="input input-bordered w-full font-mono text-sm ltr"
                />
              </div>
            )}
            {activeTab === "hoghoghi" && (
              <div className="flex flex-col gap-2 items-end ">
                <label className="text-sm font-semibold"> شناسه ملی شرکت</label>
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
                  className="input input-bordered w-full font-mono text-sm ltr"
                />
              </div>
            )}
            <div className="flex flex-col gap-2 items-end ">
              <label className="text-sm font-semibold">مبلغ (ریال)</label>
              <input
                type="text"
                value={formatNumber(price)}
                onChange={(e) => setPriceState(parseNumber(e.target.value))}
                className="input input-bordered w-full font-semibold"
                placeholder="مثال: 1,500,000"
              />
            </div>
            <div className="flex flex-col gap-2 items-end ">
              <label className="text-sm font-semibold">تاریخ سررسید</label>
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
                inputClass="input input-bordered w-full"
                placeholder="تاریخ را انتخاب کنید"
                format="YYYY/MM/DD"
              />
            </div>
            <FileUploader
              ref={checkPic}
              orderNumber={parent_GUID}
              subFolder={itemGUID}
              title="تصویر چک (الزامی)"
              inputId="file-upload-check-pic"
            />
            <div className="flex flex-col gap-4 ">
              <FileUploader
                ref={checkConfirmPic}
                orderNumber={parent_GUID}
                subFolder={itemGUID}
                title="رسید ثبت چک (اختیاری)"
                inputId="file-upload-check-confirm"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  mutation.mutate({ itemGUID });
                }}
                disabled={mutation.isPending}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  mutation.isPending
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm hover:shadow-md"
                }`}
              >
                {mutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-gray-600"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    در حال ثبت...
                  </div>
                ) : (
                  "ثبت"
                )}
              </button>
            </div>
          </>
        )}

        {type === "cash" && (
          <>
            <div className="flex flex-col gap-2 items-end">
              <label className="text-sm font-semibold">نام بانک مقصد</label>
              <div className="relative w-full">
                <select
                  className="select select-bordered w-full text-right"
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
                {/* Tooltip for selected bank */}
                {bankName && (
                  <div className="    w-full p-3 rounded bg-slate-200  text-xs ">
                    <div className="text-center">
                      <div className="font-bold text-sm mb-2 text-slate-700">
                        شماره حساب بانک انتخاب شده
                      </div>
                      <div className="bg-slate-100 px-3 py-2 rounded text-center font-bold text-sm">
                        {extractAccountFromBankValue(bankName)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <label className="text-sm font-semibold">تاریخ واریز</label>
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
                inputClass="input input-bordered w-full"
                placeholder="تاریخ را انتخاب کنید"
                format="YYYY/MM/DD"
                maxDate={new DateObject()} // اینجا تاریخ امروز
              />
            </div>
            <div className="flex flex-col gap-2 items-end">
              <label className="text-sm font-semibold">مبلغ (ریال)</label>
              <input
                type="text"
                value={formatNumber(priceCash)}
                onChange={(e) => setPriceCashState(parseNumber(e.target.value))}
                className="input input-bordered w-full font-semibold"
                placeholder="مثال: 1,500,000"
              />
            </div>
            <FileUploader
              ref={cashPic}
              orderNumber={parent_GUID}
              subFolder={itemGUID}
              title="تصویر فیش واریزی (الزامی)"
              inputId="file-upload-check-pic"
            />
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  mutation.mutate({ itemGUID });
                }}
                disabled={mutation.isPending}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  mutation.isPending
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm hover:shadow-md"
                }`}
              >
                {mutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-gray-600"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    در حال ثبت...
                  </div>
                ) : (
                  "ثبت"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadCheckoutForm;
