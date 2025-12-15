import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";

interface BankFilterProps {
  banks: string[];
  selectedBanks: string[];
  onSelectionChange: (selected: string[]) => void;
}

export const BankFilter = ({
  banks,
  selectedBanks,
  onSelectionChange,
}: BankFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // فیلتر کردن بانک‌ها بر اساس جستجو
  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) {
      return banks;
    }
    return banks.filter((bank) =>
      bank.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [banks, searchQuery]);

  // بستن dropdown با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleBank = (bank: string) => {
    if (selectedBanks.includes(bank)) {
      onSelectionChange(selectedBanks.filter((b) => b !== bank));
    } else {
      onSelectionChange([...selectedBanks, bank]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
    setSearchQuery("");
  };

  const selectAll = () => {
    onSelectionChange([...filteredBanks]);
  };

  return (
    <div className="flex flex-col relative" ref={dropdownRef}>
      <label className="mb-1 text-gray-600">نام بانک</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border p-1 rounded-md text-right flex items-center justify-between bg-white hover:bg-gray-50"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
          <span className="text-sm text-gray-700 flex-1 text-right mr-2">
            {selectedBanks.length === 0
              ? "همه بانک‌ها"
              : selectedBanks.length === 1
              ? selectedBanks[0]
              : `${selectedBanks.length} بانک انتخاب شده`}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col">
            {/* جستجو */}
            <div className="p-2 border-b sticky top-0 bg-white">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="جستجوی بانک..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border p-1.5 pr-8 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* دکمه‌های انتخاب همه / پاک کردن */}
            <div className="flex gap-2 p-2 border-b bg-gray-50">
              <button
                type="button"
                onClick={selectAll}
                className="flex-1 text-xs py-1 px-2 bg-sky-500 text-white rounded hover:bg-sky-600"
              >
                انتخاب همه
              </button>
              {selectedBanks.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="flex-1 text-xs py-1 px-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  پاک کردن
                </button>
              )}
            </div>

            {/* لیست بانک‌ها */}
            <div className="overflow-y-auto max-h-60">
              {filteredBanks.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  بانکی یافت نشد
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <label
                    key={bank}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBanks.includes(bank)}
                      onChange={() => toggleBank(bank)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 flex-1 text-right">
                      {bank}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* نمایش بانک‌های انتخاب شده */}
      {selectedBanks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedBanks.slice(0, 3).map((bank) => (
            <span
              key={bank}
              className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs"
            >
              {bank.length > 20 ? `${bank.substring(0, 20)}...` : bank}
              <button
                type="button"
                onClick={() => toggleBank(bank)}
                className="hover:bg-sky-200 rounded p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedBanks.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs">
              +{selectedBanks.length - 3} بیشتر
            </span>
          )}
        </div>
      )}
    </div>
  );
};

