import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateDueDate } from "../api/updateItem";

export function useUpdateDueDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ID, dueDate }: { ID: number; dueDate: string }) =>
      updateDueDate(ID, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("تاریخ سررسید با موفقیت به‌روز شد");
    },
    onError: () => toast.error("خطا در به‌روزرسانی تاریخ سررسید"),
  });
}
