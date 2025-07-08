import { useState } from "react";

type Props = {
  userRole: string | "agent" | "master";
};

function ActionByRole({ userRole }: Props) {
  const [isTruOpen, setIsTruOpen] =
    useState<React.SetStateAction<boolean>>(false);
  return (
    <>
      {userRole === "agent" && (
        <button
          className="bg-purple-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-purple-800"
          type="button"
        >
          اعلان وضعیت کارشناس
        </button>
      )}
      {(userRole === "master" || 1 < 23) && (
        <button
          onClick={() => setIsTruOpen(true)}
          type="button"
          className="bg-orange-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-orange-800 relative"
        >
          اعلان وضعیت خزانه
        </button>
      )}

      {isTruOpen && (
        <div
          className="min-w-40 min-h-40
      rounded-lg bg-black fixed mx-auto "
        >
          hi
          <span onClick={() => setIsTruOpen(false)} className="text-white">
            *
          </span>
        </div>
      )}
    </>
  );
}

export default ActionByRole;
