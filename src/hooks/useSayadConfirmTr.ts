import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { updateSayadVerifiedTr } from "../api/updateItem";

export function useSayadConfirmTr(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ID: number) => updateSayadVerifiedTr(ID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
    },
    onError: () => toast.error("خطا در تایید ثبت چک صیاد"),
  });
}
