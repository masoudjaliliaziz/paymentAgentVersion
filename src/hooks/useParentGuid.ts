import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

export const useParentGuid = (): string => {
  const [params] = useSearchParams();

  const guid = useMemo(() => {
    const fromUrl = params.get("guid_form") ?? ""; // اگر null بود، تبدیل به "" میشه
    if (fromUrl) return fromUrl;

    const fromStorage = localStorage.getItem("guid_form") ?? "";
    return fromStorage;
  }, [params]);

  return guid;
};
