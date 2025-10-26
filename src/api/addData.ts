import toast from "react-hot-toast";
import type { Data } from "../types/apiTypes";
import { getDigest } from "../utils/getDigest";

export async function handleAddItem(
  data: Partial<Data> & {
    Verified?: string;
    VerifiedHoghoghi?: string;
    itemGUID: string;
  }
) {
  const listName = "CustomerPayment";
  const itemType = "SP.Data.CustomerPaymentListItem";
  const webUrl = "https://crm.zarsim.com";

  if (!data.price || !data.dueDate) {
    toast.error("لطفاً مبلغ و تاریخ سررسید را وارد کنید.");
    return;
  }

  if (data.cash === "1") {
    if (!data.bankName) {
      toast.error("نام بانک الزامی است.");
      return;
    }
  } else {
    if (!data.sayadiCode) {
      toast.error("شناسه صیادی الزامی است.");
      return;
    }
  }

  try {
    const digest = await getDigest();

    // تعریف bodyData با فیلدهای پایه
    const bodyData: Partial<Data> = {
      __metadata: { type: itemType },
      Title: "disributer check",
      price: data.price,
      dueDate: data.dueDate,
      sayadiCode: data.sayadiCode,
      dayOfYear: data.dayOfYear,
      nationalIdHoghoghi: data.nationalIdHoghoghi,
      cash: data.cash,
      status: data.status,
      bankName: data.bankName || "",
      SalesExpert: data.SalesExpert,
      SalesExpertAcunt_text: data.SalesExpertAcunt_text,
      parentGUID: data.parentGUID,
      itemGUID: data.itemGUID,
      invoiceType: data.invoiceType,
      customerCode: data.customerCode,
      customerTitle: data.customerTitle,

    };

    // فقط یکی از این دو را اضافه کن اگر مقدار داشته باشند
    if (data.nationalId) {
      bodyData.Verified = data.Verified;
      bodyData.nationalId = data.nationalId;
    }
    if (data.nationalIdHoghoghi) {
      bodyData.VerifiedHoghoghi = data.VerifiedHoghoghi;
      bodyData.nationalIdHoghoghi = data.nationalIdHoghoghi;
    }

    await fetch(`${webUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": digest,
      },
      body: JSON.stringify(bodyData),
    });

    toast.success("اطلاعات با موفقیت ذخیره شد.");
  } catch (err) {
    if (err instanceof Error) {
      toast.error(`خطا: ${err.message}`);
      console.error("خطا:", err.message);
    } else {
      toast.error("خطای ناشناس رخ داد");
      console.error("خطای ناشناس:", err);
    }
  }
}
