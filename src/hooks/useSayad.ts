import { useQuery } from "@tanstack/react-query";

async function getSayad(sayadId: string): Promise<string> {
  const address = "https://sandboxapi.finnotech.ir"; // یا api.finnotech.ir برای production
  const clientId = "zarsimCompany";
  const trackId = "getSayadSerInq" + Math.floor(Math.random() * 100000); // نمونه‌ی trackId تصادفی

  const token =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJiYW5rIjoiMDYyIiwiY2xpZW50SWQiOiJ6YXJzaW1Db21wYW55IiwiY2xpZW50SW5mbyI6IjMzOGRmMmJmMjNkZjc1ZGQzNTc2MzI3MTI2OTcyNDRiMzQ0MTdkYTY4ZWVkNmY1ZDkzY2VhZjhmMzU1ZDQ5MTZiMmZhOTI0MTEwM2E3NmIwMzlmZmQxYTAwMDc5MTJhZjE5YzkwODY0M2NiNjBiMzQ1ZGUwMTY4MTNjNzUwODBkNDcyNzM5ZDQiLCJjcmVhdGlvbkRhdGUiOiIxNDA0MDQyMjEyMTgyMiIsInRpbWVzdGFtcCI6MTc1MjM5NjUwMjY0OCwiZ3JhbnRUeXBlIjoiQ0xJRU5UX0NSRURFTlRJQUxTIiwicmVmcmVzaFRva2VuSWQiOiI4Y2Q5YWQ2Mi02ZjdiLTRmNjItYWYzMi02OGUxNjY5ZjQ0MmEiLCJ2ZXJzaW9uIjoiNCIsInRva2VuSWQiOiI3ZjE3ZDY2Yi05ZmU0LTQ1ZTgtOTE3OS1kYWVmZDdmZDZkZjIiLCJ0b2tlblR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJsaWZlVGltZSI6ODY0MDAwMDAwLCJpYXQiOjE3NTIzOTY1MDIsImV4cCI6MTc1MzI2MDUwMn0.qBxKmmMw0Hb_g1Cmq2dv6-VR6DP5B7rvdH0Yg6G7QEk";

  const url = `${address}/credit/v2/clients/${clientId}/sayadSerialInquiry?trackId=${trackId}&sayadId=${sayadId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error("خطا در درخواست: " + JSON.stringify(err));
  }

  const data = await response.json();

  // فرض بر این است که نام دارنده چک را می‌خواهیم
  return data.result?.name || "نامی یافت نشد";
}

export function useCurrentUser(sayadId: string) {
  return useQuery<string, Error>({
    queryKey: ["sayadData", sayadId],
    queryFn: () => getSayad(sayadId),
    enabled: !!sayadId, // فقط وقتی sayadId مقدار داشته باشه اجرا میشه
  });
}
