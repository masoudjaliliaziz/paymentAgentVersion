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

  if (loadingCheck) {
    return (
      <span className="text-xs text-slate-400">در حال دریافت تصویر چک...</span>
    );
  }

  if (errorCheck) {
    return (
      <span className="text-xs font-semibold text-red-500">
        خطا در دریافت تصویر چک
      </span>
    );
  }

  if (!checkFiles?.length) {
    return null;
  }

  return (
    <>
      {checkFiles.map((file) => (
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
            bg-blue-600
            px-3
            py-2
            text-xs
            font-semibold
            text-white
            whitespace-nowrap
            transition
            hover:bg-blue-700
            active:scale-95
          "
        >
          تصویر چک
        </a>
      ))}
    </>
  );
}

export default CheckPic;
