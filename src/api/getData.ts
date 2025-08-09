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
