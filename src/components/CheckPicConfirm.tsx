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

  if (loadingConfirm) {
    return (
      <span className="text-xs text-slate-400">
        در حال دریافت تصویر ثبت چک...
      </span>
    );
  }

  if (errorConfirm) {
    return (
      <span className="text-xs font-semibold text-red-500">
        خطا در دریافت تصویر ثبت چک
      </span>
    );
  }

  if (!confirmFiles?.length) {
    return null;
  }

  return (
    <>
      {confirmFiles.map((file) => (
        <a
          key={file.Name}
          href={`https://crm.zarsim.com${file.ServerRelativeUrl}`}
          target="_blank"
          rel="noreferrer"
          className="
            inline-flex
            min-h-9
            items-center
            justify-center
            rounded-lg
            bg-green-600
            px-3
            py-2
            text-xs
            font-semibold
            text-white
            whitespace-nowrap
            transition
            hover:bg-green-700
            active:scale-95
          "
        >
          {title ?? "تصویر ثبت چک"}
        </a>
      ))}
    </>
  );
}

export default CheckPicConfirm;
