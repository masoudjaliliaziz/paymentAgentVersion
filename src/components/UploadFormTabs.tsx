
import React, { useEffect, useState } from "react";
import UploadCheckoutForm from "./uploadCheckout";

import { useCustomers } from "../hooks/useCustomerData";
import Loading from "./Loading";
import { Error } from "./Error";

import PaymentTypeDropdown from "./PaymentTypeDropdown";
import InvoiceTypeDropdown from "./InvoiceTypeRadioGroup";

type Props = {
  parent_GUID: string;
  typeactiveTab: "1" | "2" | "3" | "4" | "5";
  setTypeActiveTab: (value: "1" | "2" | "3" | "4" | "5") => void;

  customerCode: string;
  customerTitle: string;

  customerCodeHeader: string;
  customerNameHeader: string;

  onCustomerDataChange?: (
    customerCode: string,
    customerTitle: string,
  ) => void;
};

const UploadFormTabs: React.FC<Props> = ({
  parent_GUID,
  typeactiveTab,
  setTypeActiveTab,
  onCustomerDataChange,
  customerCodeHeader,
  customerNameHeader,
}) => {
  const {
    isLoading,
    data: customerData,
    isError,
    error,
  } = useCustomers(parent_GUID);

  const [activeTab, setActiveTab] = useState<
    "check" | "cash" | "poz"
  >("check");

  const [formKey, setFormKey] = useState<number>(1);

  // ==========================================
  // وقتی کارتخوان انتخاب شد
  // نوع فاکتور به صورت خودکار نوع ۳ می‌شود
  // ==========================================
  useEffect(() => {
    if (activeTab === "poz") {
      setTypeActiveTab("5");
    }
  }, [activeTab, setTypeActiveTab]);

  // ارسال اطلاعات مشتری به کامپوننت والد
  useEffect(() => {
    if (
      customerData &&
      customerData.length > 0 &&
      onCustomerDataChange
    ) {
      const customer = customerData[0];

      onCustomerDataChange(
        customer.CustomerCode || "",
        customer.Title || "",
      );
    }
  }, [customerData, onCustomerDataChange]);

  if (isLoading) {
    return <Loading title="در حال بارگذاری..." />;
  }

  if (isError) {
    console.error(error);

    return <Error title="خطا در بارگذاری داده" />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ================================================= */}
      {/* Header / Controls */}
      {/* ================================================= */}

      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary-600" />

            <span className="text-sm font-bold text-slate-800">
              اطلاعات پرداخت
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px]">
          {/* ================================================= */}
          {/* نوع فاکتور */}
          {/* ================================================= */}

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="mb-3 block text-right text-xs font-bold text-slate-600">
              نوع فاکتور
            </label>

            <div className="flex items-center justify-end">
              <InvoiceTypeDropdown
                value={typeactiveTab}
                onChange={setTypeActiveTab}
                disabled={activeTab === "poz"}
              />
            </div>
          </div>

          {/* ================================================= */}
          {/* نوع پرداخت */}
          {/* ================================================= */}

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="mb-3 block text-right text-xs font-bold text-slate-600">
              نوع پرداخت
            </label>

            <PaymentTypeDropdown
              value={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* Form Content */}
      {/* ================================================= */}

      <div className="p-3 sm:p-5">
        <UploadCheckoutForm
          formKey={formKey}
          setFormKey={setFormKey}
          parent_GUID={parent_GUID}
          type={activeTab}
          typeactiveTab={typeactiveTab}
          setTypeActiveTab={setTypeActiveTab}
          customerData={customerData ?? []}
          customerCodeHeader={customerCodeHeader}
          customerNameHeader={customerNameHeader}
        />
      </div>
    </div>
  );
};

export default UploadFormTabs;

