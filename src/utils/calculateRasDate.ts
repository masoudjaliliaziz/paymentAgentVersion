import type { DebtType, PaymentType } from "../types/apiTypes";

export function calculateRasDatePayment(data: PaymentType[]) {
  // فیلتر کردن داده‌ها بر اساس status
  const filteredData = data.filter(
    (item) => item.status === "0" || item.status === "1" || item.status === "4"
  );

  const totalAmount = filteredData.reduce(
    (sum, item: PaymentType) => sum + Number(item.price),
    0
  );
  console.log("totalAmount", totalAmount);
  if (totalAmount === 0) return null;

  const weightedSum = filteredData.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.dayOfYear),
    0
  );
  console.log("weightedSum", weightedSum);
  const rasDayOfYear = Math.round(weightedSum / totalAmount);

  return rasDayOfYear; // خروجی دقیقا dayOfYear گرد شده به پایین
}

export function calculateRasDateDebt(data: DebtType[]) {
  const totalAmount = data.reduce(
    (sum, item: DebtType) => sum + Number(item.debt),
    0
  );

  if (totalAmount === 0) return null;

  const weightedSum = data.reduce(
    (sum, item) => sum + Number(item.debt) * Number(item.dayOfYear),
    0
  );
  console.log("weightedSum", weightedSum);
  const rasDayOfYear = Math.round(weightedSum / totalAmount);

  return rasDayOfYear; // خروجی دقیقا dayOfYear گرد شده به پایین
}
