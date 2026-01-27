import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { resetVerified } from "../api/updateItem";

export function useResetVerified(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ID: number) => resetVerified(ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
      toast.success("Verified با موفقیت به 0 تنظیم شد");
    },
    onError: () => toast.error("خطا در تنظیم Verified"),
  });
}

