import type { CustomerType } from "../types/apiTypes";

//load currentUser ---------------------------
export async function loadCurrentUser(
  parentGUID: string
): Promise<CustomerType[]> {
  if (!parentGUID) return [];

  const webUrl = "https://crm.zarsim.com";
  const listName = "customer_info";

  try {
    const response = await fetch(
      `${webUrl}/_api/web/lists/getbytitle('${listName}')/items?$filter=guid_form eq guid'${parentGUID}'`,
      {
        headers: { Accept: "application/json;odata=verbose" },
      }
    );

    const data = await response.json();
    return data.d.results;
  } catch (err) {
    console.error("خطا در دریافت اطلاعات مشتری:", err);
    return [];
  }
}

export type PaymentType = {
  ID: number;
  price: string;
  dueDate: string;
  sayadiCode: string;
  nationalId: string;
  itemGUID: string;
  parentGUID: string;
  dayOfYear: string;
  Title: string;
  status: string;
  agentDescription: string;
  treasuryConfirmDescription: string;
  iban: string;
  name: string;
  serialNo: string;
  seriesNo: string;
  branchCode: string;
  checksColor: string;
  Verified: string;
  SalesExpert: string;
  SalesExpertAcunt_text: string;
  cash: string;
  bankName: string;
  VerifiedHoghoghi: string;
  nationalIdHoghoghi: string;
};

//load paymentrs byu guyid for each customer -=------------------------------
export async function loadPayment(
  parentGUID: string
): Promise<Partial<PaymentType[]>> {
  const webUrl = "https://crm.zarsim.com";
  const listName = "CustomerPayment";
  let allResults: PaymentType[] = [];
  let nextUrl = `${webUrl}/_api/web/lists/getbytitle('${listName}')/items?$filter=parentGUID eq '${parentGUID}'&$top=5000`;
  try {
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: "GET",
        headers: {
          Accept: "application/json;odata=verbose",
        },
      });

      const data = await response.json();

      // فرض می‌کنیم data.d.results دقیقاً CustomerItem[] هست
      allResults = [...allResults, ...data.d.results];

      nextUrl = data.d.__next || null;
    }

    console.log("tttttttttttttttttttttttttt", allResults);
    return allResults;
  } catch (err) {
    console.error("خطا در دریافت آیتم‌ها:", err);
    return [];
  }
}

//temp for develop ( this have been load from farvardin)----------------------
export async function loadDebt(
  parentGUID: string
): Promise<Partial<PaymentType[]>> {
  const webUrl = "https://crm.zarsim.com";
  const listName = "Debt";
  let allResults: Partial<PaymentType[]> = [];
  let nextUrl = `${webUrl}/_api/web/lists/getbytitle('${listName}')/items?$filter=parentGUID eq '${parentGUID}'&$top=5000`;
  try {
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: "GET",
        headers: {
          Accept: "application/json;odata=verbose",
        },
      });

      const data = await response.json();

      // فرض می‌کنیم data.d.results دقیقاً CustomerItem[] هست
      allResults = [...allResults, ...data.d.results];

      nextUrl = data.d.__next || null;
    }

    return allResults;
  } catch (err) {
    console.error("خطا در دریافت آیتم‌ها:", err);
    return [];
  }
}
