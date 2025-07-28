import { useMutation, useQueryClient } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { updateSayadVerified } from "../api/updateItem";

export function useSayadConfirm(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ID }: { ID: number }) => updateSayadVerified(ID),
    onSuccess: () => {
      toast.success(
        "درخواست استعلام ثبت چک با موفقیت ثیت شد لطفا چن لحظه صبر نمایید"
      );
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
    },
    onError: () => toast.error("خطا در استعلام ثبت چک صیاد"),
  });
}
