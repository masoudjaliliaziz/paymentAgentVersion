import { useState } from "react";
import { useUpdatePaymentStatusTru } from "../hooks/useUpdatePaymentStatusTru";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

type Props = {
  ID: number;
};

function ActionByRole({ ID }: Props) {
  const { userRole } = useSelector((state: RootState) => state.agentFeature);
  const [isTruOpen, setIsTruOpen] =
    useState<React.SetStateAction<boolean>>(false);
  const [isAgentOpen, setIsAgentOpen] =
    useState<React.SetStateAction<boolean>>(false);
  const [status, setStatus] = useState(""); // accepted | rejected
  const [AgentStatus, setAgentStatus] = useState(""); // accepted | rejected
  const [description, setDescription] = useState("");
  const [AgentDescription, setAgentDescription] = useState("");
  const { mutate, isPending } = useUpdatePaymentStatusTru();

  const handleSubmitTru = () => {
    if (!status) return;

    const numericStatus = status === "accepted" ? 4 : 3;

    mutate(
      {
        id: ID,
        status: String(numericStatus),
        treasuryConfirmDescription:
          status === "rejected" ? description : undefined,
      },
      {
        onSuccess: () => {
          setIsTruOpen(false);
          setStatus("");
          setDescription("");
          toast.success("وضعیت با موفقیت ثبت شد.");
        },
        onError: (err) => {
          console.error(err);
        },
      }
    );
  };

  const handleSubmitAgent = () => {
    if (!AgentStatus) return;

    const numericStatus = AgentStatus === "accepted" ? 1 : 2;

    mutate(
      {
        id: ID,
        status: String(numericStatus),
        agentDescription:
          AgentStatus === "rejected" ? AgentDescription : undefined,
      },
      {
        onSuccess: () => {
          setIsAgentOpen(false);
          setAgentStatus("");
          setAgentDescription("");
          toast.success("وضعیت با موفقیت ثبت شد.");
        },
        onError: (err) => {
          console.error(err);
        },
      }
    );
  };

  return (
    <>
      {userRole === "agent" && (
        <button
          onClick={() => setIsAgentOpen(true)}
          type="button"
          className="bg-purple-600 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-purple-800"
        >
          اعلان وضعیت کارشناس
        </button>
      )}
      {userRole === "master" && (
        <button
          onClick={() => setIsTruOpen(true)}
          type="button"
          className="bg-orange-600 w-32 h-10 text-xs px-3 py-1.5 rounded-md font-semibold text-white  hover:bg-orange-800 relative "
        >
          اعلان وضعیت خزانه
        </button>
      )}

      {isTruOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 ">
          <div className="bg-white rounded-lg shadow-xl py-9 px-6 w-full max-w-md relative flex flex-col items-end gap-4 ">
            <span
              onClick={() => setIsTruOpen(false)}
              className="absolute top-2 right-2 bg-gray-600 text-white hover:text-gray-600 hover:bg-white px-2 py-1 rounded-lg cursor-pointer"
            >
              ✕
            </span>

            <span className="text-lg font-bold mb-4 mx-auto">
              اعلان وضعیت خزانه
            </span>

            <div className="w-full flex flex-col items-end gap-3">
              <label className="block text-sm font-semibold text-gray-700">
                وضعیت
              </label>
              <div className="w-full flex gap-3">
                <button
                  onClick={() => setStatus("rejected")}
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm cursor-pointer transition-colors duration-200
                  ${
                    status === "rejected"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  رد
                </button>
                <button
                  onClick={() => setStatus("accepted")}
                  type="button"
                  className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm cursor-pointer transition-colors duration-200
                  ${
                    status === "accepted"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  تایید
                </button>
              </div>
            </div>

            {status === "rejected" && (
              <div className="flex flex-col items-end w-full gap-1">
                <label className=" text-sm font-bold ">توضیحات</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="دلیل رد شدن را وارد کنید"
                  className="w-full border rounded-md p-4 font-semibold text-sm resize-none text-end"
                />
              </div>
            )}

            <button
              onClick={() => handleSubmitTru()}
              disabled={isPending}
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
              ثبت وضعیت
            </button>
          </div>
        </div>
      )}

      {isAgentOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 ">
          <div className="bg-white rounded-lg shadow-xl py-9 px-6 w-full max-w-md relative flex flex-col items-end gap-4 ">
            <span
              onClick={() => setIsAgentOpen(false)}
              className="absolute top-2 right-2 bg-gray-600 text-white hover:text-gray-600 hover:bg-white px-2 py-1 rounded-lg cursor-pointer"
            >
              ✕
            </span>

            <span className="text-lg font-bold mb-4 mx-auto">
              اعلان وضعیت کارشناس
            </span>

            <div className="w-full flex flex-col items-end gap-2">
              <label className="block text-sm font-semibold ">وضعیت</label>
              <select
                value={AgentStatus}
                onChange={(e) => setAgentStatus(e.target.value)}
                className="w-full border rounded-md p-2 text-end"
              >
                <option value="">انتخاب وضعیت</option>
                <option value="accepted">مورد تایید</option>
                <option value="rejected">رد شده</option>
              </select>
            </div>

            {AgentStatus === "rejected" && (
              <div className="flex flex-col items-end w-full gap-1">
                <label className=" text-sm font-bold ">توضیحات</label>
                <textarea
                  value={AgentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  rows={4}
                  placeholder="دلیل رد شدن را وارد کنید"
                  className="w-full border rounded-md p-4 font-semibold text-sm resize-none text-end"
                />
              </div>
            )}

            <button
              onClick={() => handleSubmitAgent()}
              disabled={isPending}
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
              ثبت وضعیت
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ActionByRole;
