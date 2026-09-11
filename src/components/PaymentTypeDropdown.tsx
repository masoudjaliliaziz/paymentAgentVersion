import React, { useEffect, useRef, useState } from "react";

type PaymentType = "check" | "cash" | "poz";

type Props = {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  className?: string;
};

const paymentTypes: { value: PaymentType; label: string }[] = [
  { value: "check", label: "ثبت چک" },
  { value: "cash", label: "واریز نقدی" },
  { value: "poz", label: " کارتخوان" },
];

const PaymentTypeDropdown: React.FC<Props> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = paymentTypes.find((type) => type.value === value);

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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* دکمه اصلی */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-right text-sm font-bold transition-all duration-200 ${
          isOpen
            ? "border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              value === "check"
                ? "bg-primary-500"
                : value === "poz"
                  ? "bg-emerald-700"
                  : "bg-green-500"
            }`}
          />

          <span>{selectedType?.label ?? "انتخاب نوع پرداخت"}</span>
        </span>

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
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {paymentTypes.map((type) => {
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
                      type.value === "check" ? "bg-primary-500" : "bg-green-500"
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

export default PaymentTypeDropdown;
