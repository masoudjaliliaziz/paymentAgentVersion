import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateSayadVerifiedTr } from "../api/updateItem";
import { updatePaymentStatus } from "./useUpdatePaymentStatusTru";
import type { PaymentType } from "../types/apiTypes";

interface BulkConfirmParams {
  checks: PaymentType[];
}

export function useBulkConfirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checks }: BulkConfirmParams) => {
      const results = [];

      for (const check of checks) {
        try {
          // تایید چک صیاد
          await updateSayadVerifiedTr(check.ID);

          // تایید وضعیت خزانه
          await updatePaymentStatus({
            id: check.ID,
            status: "4", // وضعیت تایید شده
            treasuryConfirmDescription: "تایید گروهی - تطابق مبلغ و تاریخ",
          });

          results.push({ success: true, checkId: check.ID });
        } catch (error) {
          console.error(`خطا در تایید چک ${check.ID}:`, error);
          results.push({
            success: false,
            checkId: check.ID,
            error: error instanceof Error ? error.message : "خطای نامشخص",
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        toast.success(`${successCount} چک با موفقیت تایید شد`);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} چک با خطا مواجه شد`);
      }
    },
    onError: (error) => {
      console.error("خطا در تایید گروهی:", error);
      toast.error("خطا در تایید گروهی چک‌ها");
    },
  });
}
