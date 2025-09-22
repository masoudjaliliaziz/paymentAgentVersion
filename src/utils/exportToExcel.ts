// src/utils/exportToExcel.ts
import * as XLSX from "xlsx";
import type { PaymentType } from "../types/apiTypes";
import { getBankNameFromIBAN } from "./getBankNameFromIban";

// تعریف interface برای داده‌های Excel - این interface ساختار فایل Excel خروجی را تعریف می‌کند
interface ExcelRowData {
  ردیف: number; // شماره ردیف از 1 شروع می‌شود
  نوع: string; // همیشه "چک"
  کد: string; // همیشه "24"
  ماهیت: string; // 1 برای حقوقی، 2 برای حقیقی
  شماره: string; // سریال چک
  "تاریخ سر رسید": string; // تاریخ سر رسید از استعلام صیاد (انگلیسی)
  مبلغ: string; // مبلغ از استعلام صیاد
  "عهدة بانك": string; // نام بانک
  شهر: string; // فعلاً خالی
  شعبه: string; // branchCode
  تاریخ: string; // تاریخ ثبت چک (انگلیسی)
}

/**
 * تابع exportToExcel - این تابع چک‌های فیلتر شده را به فرمت Excel تبدیل می‌کند
 * @param payments آرایه‌ای از چک‌های فیلتر شده
 * @param filename نام فایل Excel (اختیاری)
 */
export const exportToExcel = (
  payments: PaymentType[],
  filename?: string
): void => {
  try {
    // فیلتر کردن واریزهای نقدی - فقط چک‌ها را export می‌کنیم
    const checkPayments = payments.filter((payment) => payment.cash !== "1");

    if (checkPayments.length === 0) {
      console.log("هیچ چکی برای export وجود ندارد (همه واریزهای نقدی هستند)");
      return;
    }

    // تبدیل داده‌های چک به فرمت Excel
    const excelData: ExcelRowData[] = checkPayments.map((payment, index) => ({
      ردیف: index + 1, // شماره ردیف از 1 شروع می‌شود
      نوع: "چك", // همیشه "چک" طبق درخواست
      کد: "24", // همیشه "24" طبق درخواست
      ماهیت: determineEntityType(payment), // 1 برای حقوقی، 2 برای حقیقی
      شماره: payment.serialNo || "", // سریال چک
      "تاریخ سر رسید": convertToEnglishDate(
        payment.sayadConfirmDueDate || payment.dueDate || ""
      ), // تاریخ سر رسید از استعلام صیاد
      مبلغ: payment.sayadConfirmAmount || payment.price || "", // مبلغ از استعلام صیاد
      "عهدة بانك": payment.iban
        ? getBankNameFromIBAN(payment.iban)
        : payment.bankName || "", // نام بانک از IBAN یا bankName
      شهر: "", // فعلاً خالی طبق درخواست
      شعبه: payment.branchCode || "", // branchCode
      تاریخ: convertToEnglishDate(payment.dueDate || ""), // تاریخ ثبت چک
    }));

    // ایجاد workbook جدید
    const workbook = XLSX.utils.book_new();

    // تبدیل داده‌ها به worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // تنظیم عرض ستون‌ها برای بهتر نمایش داده‌ها
    const columnWidths = [
      { wch: 8 }, // ردیف
      { wch: 10 }, // نوع
      { wch: 8 }, // کد
      { wch: 12 }, // ماهیت
      { wch: 15 }, // شماره
      { wch: 18 }, // تاریخ سر رسید
      { wch: 15 }, // مبلغ
      { wch: 20 }, // عهده بانک
      { wch: 10 }, // شهر
      { wch: 12 }, // شعبه
      { wch: 18 }, // تاریخ
    ];
    worksheet["!cols"] = columnWidths;

    // اضافه کردن worksheet به workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "چک‌های فیلتر شده");

    // تولید نام فایل با timestamp اگر نام مشخص نشده باشد
    const defaultFilename = `چک_های_فیلتر_شده_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // دانلود فایل Excel
    XLSX.writeFile(workbook, finalFilename);

    console.log(`فایل Excel با موفقیت ایجاد شد: ${finalFilename}`);
  } catch (error) {
    // مدیریت خطا در صورت بروز مشکل
    console.error("خطا در ایجاد فایل Excel:", error);
    throw new Error("خطا در ایجاد فایل Excel. لطفاً دوباره تلاش کنید.");
  }
};

/**
 * تابع تعیین نوع شخصیت (حقیقی یا حقوقی) - این تابع بر اساس فیلدهای موجود نوع شخصیت را تشخیص می‌دهد
 * @param payment داده چک
 * @returns "1" برای حقوقی، "2" برای حقیقی
 */
const determineEntityType = (payment: PaymentType): string => {
  // اگر nationalIdHoghoghi موجود باشد، حقوقی است
  if (payment.nationalIdHoghoghi && payment.nationalIdHoghoghi.trim() !== "") {
    return "1"; // حقوقی
  }

  // اگر nationalId موجود باشد، حقیقی است
  if (payment.nationalId && payment.nationalId.trim() !== "") {
    return "2"; // حقیقی
  }

  // اگر هیچ‌کدام موجود نباشد، بر اساس نام قضاوت می‌کنیم
  // اگر نام شامل کلمات حقوقی باشد، حقوقی در نظر می‌گیریم
  const legalKeywords = [
    "شرکت",
    "مؤسسه",
    "سازمان",
    "انجمن",
    "اتحادیه",
    "تعاونی",
    "محدود",
    "سهامی",
  ];
  const name = payment.name || "";

  if (legalKeywords.some((keyword) => name.includes(keyword))) {
    return "1"; // حقوقی
  }

  return "2"; // پیش‌فرض: حقیقی
};

/**
 * تابع تبدیل اعداد فارسی به انگلیسی - این تابع اعداد فارسی را به انگلیسی تبدیل می‌کند
 * @param persianNumber رشته شامل اعداد فارسی
 * @returns رشته با اعداد انگلیسی
 */
const convertPersianToEnglishNumbers = (persianNumber: string): string => {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return persianNumber.replace(/[۰-۹]/g, (char) => {
    const index = persianDigits.indexOf(char);
    return index !== -1 ? englishDigits[index] : char;
  });
};

/**
 * تابع تبدیل تاریخ فارسی به انگلیسی - این تابع تاریخ‌های فارسی را به فرمت انگلیسی تبدیل می‌کند
 * @param dateString رشته تاریخ (فارسی یا انگلیسی)
 * @returns تاریخ انگلیسی بدون / و با فرمت YYYY-MM-DD
 */
const convertToEnglishDate = (dateString: string): string => {
  if (!dateString) return "";

  try {
    // ابتدا اعداد فارسی را به انگلیسی تبدیل می‌کنیم
    let cleanDate = convertPersianToEnglishNumbers(dateString);

    // حذف فاصله‌ها و کاراکترهای اضافی
    cleanDate = cleanDate.replace(/\s+/g, "").trim();

    // اگر تاریخ در فرمت ISO باشد، آن را به فرمت مناسب تبدیل می‌کنیم
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      // تبدیل به فرمت YYYYMMDD (بدون جداکننده)
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}${month}${day}`;
    }

    // اگر تاریخ شامل / یا - باشد، آن را پردازش می‌کنیم
    if (cleanDate.includes("/") || cleanDate.includes("-")) {
      // تشخیص جداکننده و تقسیم تاریخ
      const separator = cleanDate.includes("/") ? "/" : "-";
      const parts = cleanDate.split(separator);

      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");

        // اگر سال 4 رقمی و کمتر از 2000 باشد، احتمالاً شمسی است
        if (year.length === 4 && parseInt(year) < 2000) {
          // در اینجا باید تبدیل شمسی به میلادی انجام شود
          // برای سادگی، همان تاریخ را برمی‌گردانیم
          return `${year}${month}${day}`;
        }

        return `${year}${month}${day}`;
      }
    }

    // اگر فرمت دیگری باشد، / ها و - ها را حذف می‌کنیم
    return cleanDate.replace(/[/-]/g, "");
  } catch (error) {
    console.warn("خطا در تبدیل تاریخ:", error);
    return dateString.replace(/\//g, "-");
  }
};

/**
 * تابع کمکی برای فرمت کردن تاریخ - این تابع تاریخ را به فرمت مناسب تبدیل می‌کند
 * @param dateString رشته تاریخ
 * @returns تاریخ فرمت شده
 */
export const formatDateForExcel = (dateString: string): string => {
  if (!dateString) return "";

  try {
    // اگر تاریخ در فرمت ISO باشد، آن را به فرمت قابل خواندن تبدیل می‌کنیم
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // اگر تاریخ معتبر نباشد، همان رشته اصلی را برمی‌گردانیم
    }

    // تبدیل به فرمت شمسی یا میلادی قابل خواندن
    return date.toLocaleDateString("fa-IR");
  } catch (error) {
    console.warn("خطا در فرمت کردن تاریخ:", error);
    return dateString;
  }
};

/**
 * تابع کمکی برای فرمت کردن مبلغ - این تابع مبلغ را به فرمت مناسب تبدیل می‌کند
 * @param amount مبلغ
 * @returns مبلغ فرمت شده
 */
export const formatAmountForExcel = (amount: string | number): string => {
  if (!amount) return "0";

  try {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "0";

    // فرمت کردن مبلغ با جداکننده هزارگان
    return numAmount.toLocaleString("fa-IR");
  } catch (error) {
    console.warn("خطا در فرمت کردن مبلغ:", error);
    return amount.toString();
  }
};
