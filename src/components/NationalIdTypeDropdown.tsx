import React, { useState, useRef, useEffect } from "react";

type NationalIdType = "haghighi" | "hoghoghi";

type Props = {
  value: NationalIdType;
  onChange: (value: NationalIdType) => void;
  className?: string;
};

const NationalIdTypeDropdown: React.FC<Props> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nationalIdTypes = [
    {
      value: "haghighi" as NationalIdType,
      label: "شناسه حقیقی",
      description:
        "شناسه حقیقی مربوط به افراد حقیقی است که شامل کد ملی می‌شود.",
    },
    {
      value: "hoghoghi" as NationalIdType,
      label: "شناسه حقوقی",
      description:
        "شناسه حقوقی مخصوص شرکت‌ها و سازمان‌ها است و شامل شناسه ملی شرکت می‌شود.",
    },
  ];

  const selectedType = nationalIdTypes.find((type) => type.value === value);

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
          {selectedType?.label || "انتخاب نوع شناسه"}
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
          {nationalIdTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`w-full px-4 py-4 text-right hover:bg-gray-50 transition-colors duration-150 ${
                value === type.value
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700"
              }`}
              onClick={() => {
                onChange(type.value);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col items-end">
                <span
                  className={`font-semibold text-sm ${
                    value === type.value ? "text-primary-700" : "text-gray-900"
                  }`}
                >
                  {type.label}
                </span>
                <span
                  className={`text-xs mt-1 leading-relaxed ${
                    value === type.value ? "text-primary-600" : "text-gray-500"
                  }`}
                >
                  {type.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NationalIdTypeDropdown;
