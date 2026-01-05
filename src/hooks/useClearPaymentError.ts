import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { clearPaymentError } from "./../api/updateItem";
export const useClearPaymentError = (
  parentGuid: string
): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    // mutationFn فقط باید ID بگیره و Promise<void> برگردونه
    mutationFn: (ID: number) => clearPaymentError(ID),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments", parentGuid],
      });
    },
  });
};
