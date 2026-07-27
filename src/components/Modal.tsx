import { useState } from "react";

type Props = {
  id: string; // برای سازگاری با کدهای قبلی (اختیاری)
  title: {
    slag: string;
    data: string;
  };
};

function Modal({ title }: Props) {
  const { slag, data } = title;
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* دکمه باز کردن مدال */}
      <button
        type="button"
        className="font-bold text-xs text-sky-700 border-2 border-sky-700 rounded-md px-2.5 py-1.5 transition-all hover:bg-sky-700 hover:text-white"
        onClick={openModal}
      >
        {slag}
      </button>

      {/* ساختار مدال با Tailwind */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          {/* بک‌دراپ تاریک و مات‌کننده پشت صفحه */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* باکس اصلی مدال */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-right align-middle shadow-2xl transition-all border border-gray-100 flex flex-col items-end">
            {/* عنوان مدال */}
            <span className="text-lg font-bold text-gray-900 w-full mb-3 border-b border-gray-100 pb-2">
              {slag}
            </span>

            {/* محتوای مدال */}
            <div className="w-full text-sm text-gray-650 leading-relaxed py-3 text-right">
              {data}
            </div>

            {/* بخش دکمه‌های پایین مدال */}
            <div className="mt-5 flex justify-start w-full gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                onClick={closeModal}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Modal;
