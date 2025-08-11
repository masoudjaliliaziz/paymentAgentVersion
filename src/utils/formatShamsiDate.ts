export function formatShamsiDate(dateStr: string) {
  if (!dateStr || dateStr.length !== 8) return "تاریخ نامعتبر";

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}/${month}/${day}`; // خروجی: 1404/07/25
}
