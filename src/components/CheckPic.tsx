import { usePaymentFiles } from "../hooks/usePaymentFiles";

type Props = {
  parentGuid: string;
  itemGuid: string;
};

function CheckPic({ parentGuid, itemGuid }: Props) {
  const {
    data: checkFiles,
    isLoading: loadingCheck,
    isError: errorCheck,
  } = usePaymentFiles(parentGuid, itemGuid, "checkPic");
  return (
    <div>
      {loadingCheck && <p>در حال دریافت تصویر چک...</p>}
      {errorCheck && <p className="text-red-500">خطا در دریافت تصویر چک</p>}
      {checkFiles?.length === 0 && <p>تصویری یافت نشد</p>}
      <ul className="list-disc list-inside">
        {checkFiles?.map((file) => (
          <div key={file.Name}>
            <a
              href={`https://crm.zarsim.com${file.ServerRelativeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-blue-800"
            >
              دانلود تصویر چک
            </a>
          </div>
        ))}
      </ul>
    </div>
  );
}

export default CheckPic;
