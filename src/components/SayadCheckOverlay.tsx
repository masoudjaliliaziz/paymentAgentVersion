import { motion, AnimatePresence } from "framer-motion";

interface SayadCheckOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  color?: string; // رنگ دکمه
}

const overlayVariants = {
  hidden: { opacity: 0, y: "100vh" },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100vh" },
};

export const SayadCheckOverlay = ({
  isOpen,
  onClose,
  color = "#0ea5e9", // آبی پیش‌فرض
}: SayadCheckOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center"
          style={{
            backgroundColor: `${color}dd`, // شفافیت
            backdropFilter: "blur(8px)",
          }}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white p-8 rounded-xl shadow-xl text-center w-96 max-w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <p className="text-xl font-bold mb-4 text-gray-800">
              در حال استعلام ثبت چک
            </p>
            <div className="animate-pulse text-lg text-gray-500">
              لطفا چند لحظه صبر کنید
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            >
              بستن
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
