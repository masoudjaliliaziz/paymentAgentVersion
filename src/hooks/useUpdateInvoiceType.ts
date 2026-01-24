import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInvoiceType } from "../api/updateItem";

export const useUpdateInvoiceType = (parentGuid: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoiceType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", parentGuid],
      });
    },
  });
};
