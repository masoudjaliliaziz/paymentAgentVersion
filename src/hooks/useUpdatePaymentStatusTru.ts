import toast from "react-hot-toast";
import { getDigest } from "../utils/getDigest";

interface UpdatePaymentStatusParams {
  id: number;
  status: string;
  treasuryUnconfirmReason?: string;
  agentUnconfirmReason?: string;
}

interface UpdatePayload {
  __metadata: {
    type: string;
  };
  status: string;
  treasuryUnconfirmReason?: string;
  agentUnconfirmReason?: string;
}

export const updatePaymentStatus = async ({
  id,
  status,
  treasuryUnconfirmReason,
  agentUnconfirmReason,
}: UpdatePaymentStatusParams): Promise<true> => {
  const digest = await getDigest();

  const payload: UpdatePayload = {
    __metadata: {
      type: "SP.Data.CustomerPaymentListItem", // 👈 این خط حیاتی بود
    },
    status,
  };

  if (status === "3" && treasuryUnconfirmReason) {
    payload.treasuryUnconfirmReason = treasuryUnconfirmReason;
  }
  if (status === "2" && agentUnconfirmReason) {
    payload.agentUnconfirmReason = agentUnconfirmReason;
  }
  const res = await fetch(
    `https://crm.zarsim.com/_api/web/lists/getbytitle('CustomerPayment')/items(${id})`,
    {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json;odata=verbose",
        "X-RequestDigest": digest,
        "IF-MATCH": "*",
        "X-HTTP-Method": "MERGE",
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    }
  );

  if (!res.ok) {
    const err = await res.text();
    toast.error(`خطا در بروزرسانی: ${err}`);
  }

  return true;
};

// src/hooks/useUpdatePaymentStatus.ts
import { useMutation } from "@tanstack/react-query";

export function useUpdatePaymentStatusTru() {
  return useMutation({
    mutationFn: updatePaymentStatus,
  });
}
