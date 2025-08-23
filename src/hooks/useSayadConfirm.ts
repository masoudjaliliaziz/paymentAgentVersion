import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateSayadVerified } from "../api/updateItem";

export function useSayadConfirm(parentGUID: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ID }: { ID: number }) => {
      // افزودن timeout به درخواست
      return Promise.race([
        updateSayadVerified(ID),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout: API response took too long")),
            10000
          )
        ),
      ]);
    },
    onSuccess: (_data, variables) => {
      console.log(
        `دیباگ: استعلام صیاد برای ID ${variables.ID} با موفقیت انجام شد`
      );
      queryClient.invalidateQueries({ queryKey: ["payments", parentGUID] });
    },
    onError: (error, variables) => {
      const errorMessage = error.message || "خطا در استعلام ثبت چک صیاد";
      console.error(
        `دیباگ: خطا در استعلام صیاد برای ID ${variables.ID}:`,
        error
      );
      toast.error(`خطا برای پرداخت ${variables.ID}: ${errorMessage}`);
    },
  });
}
