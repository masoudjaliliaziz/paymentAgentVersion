import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { updateSayadVerified } from "../api/updateItem";

export function useRejectSayadConfirmTr(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ID: number) => updateSayadVerified(ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
    },
    onError: () => toast.error("خطا در رد ثبت چک صیاد"),
  });
}
