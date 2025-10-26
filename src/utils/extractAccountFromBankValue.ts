/**
 * استخراج شماره حساب از value بانک
 *
 * @author Mahdi Navaei
 * @param bankValue - value بانک از bankOptions
 * @returns شماره حساب استخراج شده یا "یافت نشد"
 */
export function extractAccountFromBankValue(bankValue: string): string {
  if (!bankValue) return "یافت نشد";

  // الگو 1: شماره‌های با فرمت 1-10706567-110-284 (اولویت اول)
  const dashPattern = /\d+-\d+-\d+-\d+/g;
  const dashMatches = bankValue.match(dashPattern);
  if (dashMatches && dashMatches.length > 0) {
    return dashMatches[0];
  }

  // الگو 2: شماره‌های 13 رقمی
  const thirteenDigitPattern = /\d{13}/g;
  const thirteenDigitMatches = bankValue.match(thirteenDigitPattern);
  if (thirteenDigitMatches && thirteenDigitMatches.length > 0) {
    return thirteenDigitMatches[0];
  }

  // الگو 3: شماره‌های 10 رقمی
  const tenDigitPattern = /\d{10}/g;
  const tenDigitMatches = bankValue.match(tenDigitPattern);
  if (tenDigitMatches && tenDigitMatches.length > 0) {
    return tenDigitMatches[0];
  }

  // الگو 4: شماره‌های 9 رقمی (برای پارسیان)
  const nineDigitPattern = /\d{9}/g;
  const nineDigitMatches = bankValue.match(nineDigitPattern);
  if (nineDigitMatches && nineDigitMatches.length > 0) {
    return nineDigitMatches[0];
  }

  // الگو 5: شماره‌های 12 رقمی (برای پارسیان)
  const twelveDigitPattern = /\d{12}/g;
  const twelveDigitMatches = bankValue.match(twelveDigitPattern);
  if (twelveDigitMatches && twelveDigitMatches.length > 0) {
    return twelveDigitMatches[0];
  }

  return "یافت نشد";
}
