import { usePaymentFiles } from "../hooks/usePaymentFiles";

interface PaymentRowProps {
  parentGuid: string;
  itemGuid: string;
  seri: string;
  serial: string;
  dueDate: string;
  price: string;
}

export const PaymentRow = ({
  parentGuid,
  itemGuid,
  seri,
  serial,
  dueDate,
  price,
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
    <div className="p-4 bg-white border rounded my-4 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col gap-1">
            {" "}
            <p className="font-bold">سری</p>
            <span>{seri}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold">سریال</p>
            <span>{serial}</span>
          </div>
        </div>
        <p className="font-bold">تاریخ سررسید: {dueDate}</p>
        <div className="flex justify-center items-center gap-1">
          <span className="font-semibold text-xs text-sky-600">ریال</span>
          <p className="font-bold"> مبلغ: {Number(price).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
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
                  دانلود تصویر ثبت چک
                </a>
              </div>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
