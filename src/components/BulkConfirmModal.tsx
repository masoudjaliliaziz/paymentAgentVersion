import React, { useState } from "react";
import { X, Check, Trash2 } from "lucide-react";
import type { PaymentType } from "../types/apiTypes";

interface BulkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  checks: PaymentType[];
  onConfirm: (selectedChecks: PaymentType[]) => void;
  onRemoveCheck: (checkId: number) => void;
}

export function BulkConfirmModal({
  isOpen,
  onClose,
  checks,
  onConfirm,
  onRemoveCheck,
}: BulkConfirmModalProps) {
  const [selectedChecks, setSelectedChecks] = useState<PaymentType[]>([]);

  // Initialize selectedChecks when modal opens or checks change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedChecks(checks);
    }
  }, [isOpen, checks]);

  const handleRemoveCheck = (checkId: number) => {
    setSelectedChecks((prev) => prev.filter((check) => check.ID !== checkId));
    onRemoveCheck(checkId);
  };

  const handleConfirm = () => {
    onConfirm(selectedChecks);
    onClose();
  };

  const formatPrice = (price: string) => {
    return Number(price || 0).toLocaleString("fa-IR");
  };

  const formatDate = (date: string) => {
    if (!date) return "نامشخص";
    return date;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            تایید گروهی چک‌های تطبیق‌یافته
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            تعداد چک‌های قابل تایید:{" "}
            <span className="font-bold">{selectedChecks.length}</span>
          </p>
          <p className="text-sm text-blue-800">
            مجموع مبلغ:{" "}
            <span className="font-bold">
              {formatPrice(
                selectedChecks
                  .reduce((sum, check) => sum + Number(check.price || 0), 0)
                  .toString()
              )}{" "}
              ریال
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedChecks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>هیچ چکی برای تایید انتخاب نشده است</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedChecks.map((check) => (
                <div
                  key={check.ID}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">کد صیادی:</span>
                      <p className="font-medium">{check.sayadiCode}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">مبلغ:</span>
                      <p className="font-medium">
                        {formatPrice(check.price)} ریال
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">تاریخ سررسید:</span>
                      <p className="font-medium">{formatDate(check.dueDate)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">نام مشتری:</span>
                      <p className="font-medium">{check.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCheck(check.ID)}
                    className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                    title="حذف از لیست تایید"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedChecks.length === 0}
            className={`px-6 py-2 rounded-md text-white font-semibold flex items-center gap-2 ${
              selectedChecks.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Check size={16} />
            تایید {selectedChecks.length} چک
          </button>
        </div>
      </div>
    </div>
  );
}
