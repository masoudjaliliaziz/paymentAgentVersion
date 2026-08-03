import toast from "react-hot-toast";
import type { Data } from "../types/apiTypes";
import { getDigest } from "../utils/getDigest";

export async function handleAddItem(
  data: Partial<Data> & {
    Verified?: string;
    VerifiedHoghoghi?: string;
    itemGUID: string;
  },
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
      customerCodeHeader: data.customerCodeHeader,
      customerNameHeader: data.customerNameHeader,
      cashResean: data.cashResean,
      agentDescription: data.agentDescription,
      selectedCheckSayadiForCheckFori:
        data.selectedCheckSayadiForCheckFori,
      selectedCheckSerialNoForCheckFor: String(
        data.selectedCheckSerialNoForCheckFor,
      ),
    };

    if (data.nationalId) {
      bodyData.Verified = data.Verified;
      bodyData.nationalId = data.nationalId;
    }

    if (data.nationalIdHoghoghi) {
      bodyData.VerifiedHoghoghi = data.VerifiedHoghoghi;
      bodyData.nationalIdHoghoghi = data.nationalIdHoghoghi;
    }

    // ===================== DEBUG =====================
    console.group("🚀 SharePoint Request");

    console.log("URL:");
    console.log(
      `${webUrl}/_api/web/lists/getbytitle('${listName}')/items`,
    );

    console.log("ItemType:");
    console.log(itemType);

    console.log("Digest:");
    console.log(digest);

    console.log("Body:");
    console.table(bodyData);
    console.log(JSON.stringify(bodyData, null, 2));
    // =================================================

    const response = await fetch(
      `${webUrl}/_api/web/lists/getbytitle('${listName}')/items`,
      {
        method: "POST",
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-RequestDigest": digest,
        },
        body: JSON.stringify(bodyData),
      },
    );

    console.log("Status:", response.status);
    console.log("StatusText:", response.statusText);
    console.log("OK:", response.ok);

    const responseText = await response.text();

    console.log("Response:");
    console.log(responseText);

    console.groupEnd();

    if (!response.ok) {
      toast.error("خطا در ثبت اطلاعات");
      throw new Error(responseText);
    }

    toast.success("اطلاعات با موفقیت ذخیره شد.");
  } catch (err) {
    console.group("❌ SharePoint Error");

    if (err instanceof Error) {
      console.error(err.message);
      toast.error(`خطا: ${err.message}`);
    } else {
      console.error(err);
      toast.error("خطای ناشناس رخ داد");
    }

    console.groupEnd();
  }
}