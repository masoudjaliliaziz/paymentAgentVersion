import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export function getShamsiDateFromDayOfYear(
  dayOfYear: number,
  year: number = 1404
) {
  const date = new DateObject({
    calendar: persian,
    locale: persian_fa,
    year,
    month: 1,
    day: 1,
  });

  date.add(dayOfYear - 1, "days");

  return date.format("YYYY/MM/DD"); // خروجی: مثلا 1403/05/16
}
