
import React, { useEffect, useRef, useState } from "react";

type InvoiceType = "1" | "2" | "3" | "4" | "5";

type Props = {
  value: InvoiceType;
  onChange: (value: InvoiceType) => void;
  className?: string;
  disabled?: boolean;
};

const invoiceTypes: {
  value: InvoiceType;
  label: string;
}[] = [
  { value: "1", label: "نوع ۱" },
  { value: "2", label: "نوع ۲" },
  { value: "5", label: "نوع ۳" },
  { value: "3", label: "دانش‌بنیان" },
  { value: "4", label: "نامشخص" },
];

const InvoiceTypeDropdown: React.FC<Props> = ({
  value,
  onChange,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = invoiceTypes.find(
    (type) => type.value === value,
  );

  // اگر dropdown قفل شد، منوی باز را ببند
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full ${className}`}
    >
      {/* ================================================= */}
      {/* دکمه اصلی */}
      {/* ================================================= */}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((current) => !current);
          }
        }}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right text-sm font-bold transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-90"
            : isOpen
              ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              value === "5"
                ? "bg-green-500"
                : value === "3"
                  ? "bg-green-500"
                  : value === "4"
                    ? "bg-slate-400"
                    : "bg-primary-500"
            }`}
          />

          <span>
            {selectedType?.label ?? "انتخاب نوع فاکتور"}
          </span>
        </span>

        {disabled ? (
          // آیکون قفل
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-4-6V9a4 4 0 118 0v2m-8 0h8a2 2 0 012 2v5a2 2 0 01-2 2H8a2 2 0 01-2-2v-5a2 2 0 012-2z"
            />
          </svg>
        ) : (
          // فلش
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* ================================================= */}
      {/* Dropdown */}
      {/* ================================================= */}

      {isOpen && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {invoiceTypes.map((type) => {
            const isActive = value === type.value;

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  onChange(type.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-primary-50 font-bold text-primary-700"
                    : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      type.value === "5" || type.value === "3"
                        ? "bg-green-500"
                        : type.value === "4"
                          ? "bg-slate-400"
                          : "bg-primary-500"
                    }`}
                  />

                  {type.label}
                </span>

                {isActive && (
                  <svg
                    className="h-4 w-4 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoiceTypeDropdown;

