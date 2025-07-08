import { useQuery } from "@tanstack/react-query";

export interface FileItem {
  Name: string;
  ServerRelativeUrl: string;
}

interface SharePointFileResponse {
  d: {
    results: {
      Name: string;
      ServerRelativeUrl: string;
    }[];
  };
}

const webUrl = "https://crm.zarsim.com";
const libraryName = "customer_checks";

export const usePaymentFiles = (
  parentGuid: string,
  itemGuid: string,
  subFolder: "checkPic" | "checkPicConfirm"
) => {
  return useQuery<FileItem[], Error>({
    queryKey: ["paymentFiles", parentGuid, itemGuid, subFolder],
    queryFn: async () => {
      const folderPath = `${libraryName}/${parentGuid}/${itemGuid}/${subFolder}`;
      const res = await fetch(
        `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${folderPath}')/Files`,
        {
          method: "GET",
          headers: {
            Accept: "application/json;odata=verbose",
          },
        }
      );

      if (!res.ok) {
        throw new Error("خطا در دریافت فایل‌ها از شیرپوینت");
      }

      const json: SharePointFileResponse = await res.json();
      return json.d.results.map((file) => ({
        Name: file.Name,
        ServerRelativeUrl: file.ServerRelativeUrl,
      }));
    },
    enabled: !!parentGuid && !!itemGuid,
  });
};
