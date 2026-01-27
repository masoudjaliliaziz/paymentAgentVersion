import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { resetVerifiedHoghoghi } from "../api/updateItem";

export function useResetVerifiedHoghoghi(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ID: number) => resetVerifiedHoghoghi(ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
      toast.success("VerifiedHoghoghi با موفقیت به 0 تنظیم شد");
    },
    onError: () => toast.error("خطا در تنظیم Verified"),
  });
}

