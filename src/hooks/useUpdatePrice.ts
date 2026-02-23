import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updatePrice } from "../api/updateItem";

export function useUpdatePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ID, price }: { ID: number; price: string }) =>
      updatePrice(ID, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("مبلغ با موفقیت به‌روز شد");
    },
    onError: () => toast.error("خطا در به‌روزرسانی مبلغ"),
  });
}
