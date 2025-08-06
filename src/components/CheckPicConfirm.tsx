import { usePaymentFiles } from "../hooks/usePaymentFiles";

type Props = {
  parentGuid: string;
  itemGuid: string;
  title?: string;
};

function CheckPicConfirm({ parentGuid, itemGuid, title }: Props) {
  const {
    data: confirmFiles,
    isLoading: loadingConfirm,
    isError: errorConfirm,
  } = usePaymentFiles(parentGuid, itemGuid, "checkPicConfirm");
  return (
    <div>
      {loadingConfirm && <p>در حال دریافت تصویر ثبت چک...</p>}
      {errorConfirm && (
        <p className="text-red-500">خطا در دریافت تصویر ثبت چک</p>
      )}
      {confirmFiles?.length === 0 && <p>تصویر ثبت چک یافت نشد</p>}
      <ul className="list-disc list-inside">
        {confirmFiles?.map((file) => (
          <div key={file.Name}>
            <a
              href={`https://crm.zarsim.com${file.ServerRelativeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-green-800"
            >
              {title ?? "دانلود تصویر ثبت چک"}
            </a>
          </div>
        ))}
      </ul>
    </div>
  );
}

export default CheckPicConfirm;
