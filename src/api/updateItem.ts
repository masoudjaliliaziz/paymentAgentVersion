import { address } from "../constants/userRoles";
import { getDigest } from "../utils/getDigest";

export async function updateSayadVerified(ID: number) {
  const digest = await getDigest();
  const res = await fetch(
    `${address}/_api/web/lists/getbytitle('CustomerPayment')/items(${ID})`,
    {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": digest,
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": "*",
      },
      body: JSON.stringify({
        __metadata: { type: "SP.Data.CustomerPaymentListItem" },

        VerifiedSayad: "0",
      }),
    }
  );

  if (!res.ok) throw new Error("استعلام ثبت چک با خطا مواجه شد");
}

export async function updateSayadVerifiedTr(ID: number) {
  const digest = await getDigest();
  const res = await fetch(
    `${address}/_api/web/lists/getbytitle('CustomerPayment')/items(${ID})`,
    {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": digest,
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": "*",
      },
      body: JSON.stringify({
        __metadata: { type: "SP.Data.CustomerPaymentListItem" },

        VerifiedConfirmSayadTr: "0",
        acceptDescrptionFromSP: "تایید",
      }),
    }
  );

  if (!res.ok) throw new Error("استعلام ثبت چک با خطا مواجه شد");
}

export async function updateSayadRejectVerifiedTr(ID: number) {
  const digest = await getDigest();
  const res = await fetch(
    `${address}/_api/web/lists/getbytitle('CustomerPayment')/items(${ID})`,
    {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": digest,
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": "*",
      },
      body: JSON.stringify({
        __metadata: { type: "SP.Data.CustomerPaymentListItem" },

        VerifiedRejectSayadTr: "0",
        acceptDescrptionFromSP: "رد",
      }),
    }
  );

  if (!res.ok) throw new Error("استعلام ثبت چک با خطا مواجه شد");
}
