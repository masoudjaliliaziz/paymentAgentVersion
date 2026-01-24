import React from "react";

type InvoiceType = "1" | "2" | "3" | "4";

type Props = {
  value: InvoiceType;
  onChange: (value: InvoiceType) => void;
  className?: string;
};

const invoiceTypes: { value: InvoiceType; label: string }[] = [
  { value: "1", label: " نوع ۱" },
  { value: "2", label: " نوع ۲" },
  { value: "3", label: " دانش‌بنیان" },
  { value: "4", label: "نامشخص" },
];

const InvoiceTypeRadioGroup: React.FC<Props> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={` ${className} flex justify-center gap-1 items-center h-32  w-full`}
    >
      {invoiceTypes.map((type) => (
        <label
          key={type.value}
          className={`
            w-full
            flex flex-col-reverse items-center gap-1 cursor-pointer rounded-lg border p-2.5
            transition-colors
            ${
              value === type.value
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:bg-gray-50"
            }
          `}
        >
          <input
            type="radio"
            name="invoiceType"
            value={type.value}
            checked={value === type.value}
            onChange={() => onChange(type.value)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />

          <span
            className={`text-sm ${
              value === type.value
                ? "text-primary-700 font-semibold"
                : "text-gray-700"
            }`}
          >
            {type.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default InvoiceTypeRadioGroup;
