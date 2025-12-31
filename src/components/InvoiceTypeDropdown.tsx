import React, { useState, useRef, useEffect } from "react";

type InvoiceType = "1" | "2" | "3" | "4";

type Props = {
  value: InvoiceType;
  onChange: (value: InvoiceType) => void;
  className?: string;
};

const InvoiceTypeDropdown: React.FC<Props> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const invoiceTypes = [
    { value: "1" as InvoiceType, label: "فاکتور نوع ۱" },
    { value: "2" as InvoiceType, label: "فاکتور نوع ۲" },
    { value: "3" as InvoiceType, label: "فاکتور  دانش بنیان" },
    { value: "4" as InvoiceType, label: "نامشخص" },
  ];

  const selectedType = invoiceTypes.find((type) => type.value === value);

  // Close dropdown when clicking outside
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
      >
        <span className="text-right">
          {selectedType?.label || "انتخاب نوع فاکتور"}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
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

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {invoiceTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`w-full px-4 py-3 text-sm text-right hover:bg-gray-50 transition-colors duration-150 ${
                value === type.value
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-gray-700"
              }`}
              onClick={() => {
                onChange(type.value);
                setIsOpen(false);
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceTypeDropdown;
