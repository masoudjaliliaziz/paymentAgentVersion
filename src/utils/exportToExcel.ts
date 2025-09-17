// src/utils/exportToExcel.ts
import * as XLSX from "xlsx";
import type { PaymentType } from "../types/apiTypes";

// تعریف interface برای داده‌های Excel - این interface ساختار فایل Excel خروجی را تعریف می‌کند
interface ExcelRowData {
  نوع: string; // همیشه "چک"
  کد: string; // همیشه "24"
  ماهیت: string; // ثابت
  شماره: string; // سریال چک
  "تاریخ سر رسید": string; // تاریخ سر رسید از استعلام صیاد
  مبلغ: string; // مبلغ از استعلام صیاد
  "عهده بانک": string; // نام بانک
  شهر: string; // فعلاً خالی
  شعبه: string; // branchCode
  تاریخ: string; // تاریخ ثبت چک (created)
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
    // تبدیل داده‌های چک به فرمت Excel
    const excelData: ExcelRowData[] = payments.map((payment) => ({
      نوع: "چک", // همیشه "چک" طبق درخواست
      کد: "24", // همیشه "24" طبق درخواست
      ماهیت: "ثابت", // ماهیت ثابت طبق درخواست
      شماره: payment.serialNo || "", // سریال چک
      "تاریخ سر رسید": payment.sayadConfirmDueDate || payment.dueDate || "", // تاریخ سر رسید از استعلام صیاد
      مبلغ: payment.sayadConfirmAmount || payment.price || "", // مبلغ از استعلام صیاد
      "عهده بانک": payment.bankName || "", // نام بانک
      شهر: "", // فعلاً خالی طبق درخواست
      شعبه: payment.branchCode || "", // branchCode
      تاریخ: payment.dueDate || "", // تاریخ ثبت چک (از dueDate استفاده می‌کنیم)
    }));

    // ایجاد workbook جدید
    const workbook = XLSX.utils.book_new();

    // تبدیل داده‌ها به worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // تنظیم عرض ستون‌ها برای بهتر نمایش داده‌ها
    const columnWidths = [
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
