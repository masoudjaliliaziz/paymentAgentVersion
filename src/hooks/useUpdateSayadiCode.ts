import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateSayadiCode } from "../api/updateItem";

export function useUpdateSayadiCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ID, sayadiCode }: { ID: number; sayadiCode: string }) =>
      updateSayadiCode(ID, sayadiCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("کد صیادی با موفقیت به‌روز شد");
    },
    onError: () => toast.error("خطا در به‌روزرسانی کد صیادی"),
  });
}
