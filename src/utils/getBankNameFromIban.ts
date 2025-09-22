// لیست کد بانک‌ها
const bankCodeMap: Record<string, string> = {
  "010": "بانک مرکزی جمهوری اسلامی ایران", // کد بانک مرکزی :contentReference[oaicite:0]{index=0}
  "011": "بانک صنعت و معدن ایران", // :contentReference[oaicite:1]{index=1}
  "012": "بانک ملت", // :contentReference[oaicite:2]{index=2}
  "013": "بانک رفاه کارگران", // :contentReference[oaicite:3]{index=3}
  "014": "بانک مسکن", // :contentReference[oaicite:4]{index=4}
  "015": "بانک سپه", // :contentReference[oaicite:5]{index=5}
  "016": "بانک کشاورزی", // :contentReference[oaicite:6]{index=6}
  "017": "بانک ملی ایران", // :contentReference[oaicite:7]{index=7}
  "018": "بانک تجارت", // :contentReference[oaicite:8]{index=8}
  "019": "بانک صادرات ایران", // :contentReference[oaicite:9]{index=9}
  "020": "بانک توسعه صادرات ایران", // :contentReference[oaicite:10]{index=10}
  "021": "پست بانک ایران", // :contentReference[oaicite:11]{index=11}
  "022": "بانک توسعه تعاون", // :contentReference[oaicite:12]{index=12}
  "051": "موسسه اعتباری توسعه", // :contentReference[oaicite:13]{index=13}
  "052": "بانک قوامین (ادغام‌شده در سپه)", // :contentReference[oaicite:14]{index=14}
  "053": "بانک کارآفرین", // :contentReference[oaicite:15]{index=15}
  "054": "بانک پارسیان", // :contentReference[oaicite:16]{index=16}
  "055": "بانک اقتصاد نوین", // :contentReference[oaicite:17]{index=17}
  "056": "بانک سامان", // :contentReference[oaicite:18]{index=18}
  "057": "بانک پاسارگاد", // :contentReference[oaicite:19]{index=19}
  "058": "بانک سرمایه", // :contentReference[oaicite:20]{index=20}
  "059": "بانک سینا", // :contentReference[oaicite:21]{index=21}
  "060": "بانک قرض‌الحسنه مهر ایران", // :contentReference[oaicite:22]{index=22}
  "061": "بانک شهر", // :contentReference[oaicite:23]{index=23}
  "062": "بانک آینده", // :contentReference[oaicite:24]{index=24}
  "063": "بانک انصار (ادغام‌شده)", // :contentReference[oaicite:25]{index=25}
  "064": "بانک گردشگری", // :contentReference[oaicite:26]{index=26}
  "066": "بانک دی", // :contentReference[oaicite:27]{index=27}
  "069": "بانک ایران زمین", // :contentReference[oaicite:28]{index=28}
  "070": "بانک قرض‌الحسنه رسالت", // :contentReference[oaicite:29]{index=29}
  "075": "موسسه اعتباری ملل (ادغام‌شده یا منحل)", // :contentReference[oaicite:30]{index=30}
  "078": "بانک خاورمیانه", // :contentReference[oaicite:31]{index=31}
  "095": "بانک مشترک ایران و ونزئولا", // :contentReference[oaicite:32]{index=32}
};


// تابع استخراج نام بانک از شماره شبا
export function getBankNameFromIBAN(iban: string): string {
  const cleaned = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^IR\d{24}$/.test(cleaned)) {
    return "شماره شبا معتبر نیست";
  }

  const bankCode = cleaned.substring(4, 7); // سه رقم بعد از IR و رقم کنترل
  return bankCodeMap[bankCode] ?? `بانک ناشناس (کد ${bankCode})`;
}
