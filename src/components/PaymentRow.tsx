import { usePaymentFiles } from "../hooks/usePaymentFiles";

interface PaymentRowProps {
  parentGuid: string;
  itemGuid: string;
  seri: string;
  serial: string;
  dueDate: string;
}

export const PaymentRow = ({
  parentGuid,
  itemGuid,
  seri,
  serial,
  dueDate,
}: PaymentRowProps) => {
  const {
    data: checkFiles,
    isLoading: loadingCheck,
    isError: errorCheck,
  } = usePaymentFiles(parentGuid, itemGuid, "checkPic");

  const {
    data: confirmFiles,
    isLoading: loadingConfirm,
    isError: errorConfirm,
  } = usePaymentFiles(parentGuid, itemGuid, "checkPicConfirm");

  return (
    <div className="p-4 bg-white border rounded my-4">
      <p className="font-bold">سری: {seri}</p>
      <p className="font-bold">سریال: {serial}</p>
      <p className="font-bold">تاریخ سررسید: {dueDate}</p>

      <div className="mt-3">
        <p className="font-bold text-blue-600">تصاویر چک:</p>
        {loadingCheck && <p>در حال دریافت تصویر چک...</p>}
        {errorCheck && <p className="text-red-500">خطا در دریافت تصویر چک</p>}
        {checkFiles?.length === 0 && <p>تصویری یافت نشد</p>}
        <ul className="list-disc list-inside">
          {checkFiles?.map((file) => (
            <li key={file.Name}>
              <a
                href={`https://crm.zarsim.com${file.ServerRelativeUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                {file.Name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="font-bold text-green-600">تصاویر ثبت چک:</p>
        {loadingConfirm && <p>در حال دریافت تصویر ثبت چک...</p>}
        {errorConfirm && (
          <p className="text-red-500">خطا در دریافت تصویر ثبت چک</p>
        )}
        {confirmFiles?.length === 0 && <p>تصویر ثبت چک یافت نشد</p>}
        <ul className="list-disc list-inside">
          {confirmFiles?.map((file) => (
            <li key={file.Name}>
              <a
                href={`https://crm.zarsim.com${file.ServerRelativeUrl}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-700 underline"
              >
                {file.Name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
