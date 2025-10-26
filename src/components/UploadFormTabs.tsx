import React, { useState, useEffect } from "react";
import UploadCheckoutForm from "./uploadCheckout"; // فرم اصلی رو از اینجا میاریم
import { useCustomers } from "../hooks/useCustomerData";
import Loading from "./Loading";
import { Error } from "./Error";
import InvoiceTypeDropdown from "./InvoiceTypeDropdown";
import PaymentTypeDropdown from "./PaymentTypeDropdown";

type Props = {
  parent_GUID: string;
  typeactiveTab: "1" | "2";
  setTypeActiveTab: (value: "1" | "2") => void;
  customerCode: string;
  customerTitle: string;
  onCustomerDataChange?: (customerCode: string, customerTitle: string) => void;
};

const UploadFormTabs: React.FC<Props> = ({
  parent_GUID,
  typeactiveTab,
  setTypeActiveTab,
  onCustomerDataChange,
}) => {
  const {
    isLoading,
    data: customerData,
    isError,
    error,
  } = useCustomers(parent_GUID);
  const [activeTab, setActiveTab] = useState<"check" | "cash">("check");
  const [formKey, setFormKey] = useState<number>(1);

  // ارسال اطلاعات مشتری به کامپوننت والد
  useEffect(() => {
    if (customerData && customerData.length > 0 && onCustomerDataChange) {
      const customer = customerData[0];
      onCustomerDataChange(customer.CustomerCode || "", customer.Title || "");
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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Controls Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              نوع فاکتور
            </label>
            <InvoiceTypeDropdown
              value={typeactiveTab}
              onChange={setTypeActiveTab}
            />
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              نوع پرداخت
            </label>
            <PaymentTypeDropdown value={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <UploadCheckoutForm
          formKey={formKey}
          setFormKey={setFormKey}
          parent_GUID={parent_GUID}
          type={activeTab}
          typeactiveTab={typeactiveTab}
          setTypeActiveTab={setTypeActiveTab}
          customerData={customerData ?? []}
        />
      </div>
    </div>
  );
};

export default UploadFormTabs;
