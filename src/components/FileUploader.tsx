import { Paperclip } from "lucide-react";
import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface FileUploaderProps {
  orderNumber?: string;
  subFolder?: string;
  title?: string;
  inputId: string; // مشخص‌کننده‌ی یکتا برای input
}

export interface FileUploaderHandle {
  getFile: () => File | null;
  clearFile: () => void;
  uploadFile: () => Promise<void>;
  hasFile: () => boolean;
}

const FileUploader = forwardRef<FileUploaderHandle, FileUploaderProps>(
  ({ orderNumber, subFolder, title, inputId }, ref) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false); // وضعیت drag over برای نمایش بصری
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isStartingCamera, setIsStartingCamera] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // تابع برای پردازش فایل انتخاب شده (از input یا drag & drop)
    const handleFileSelect = (file: File) => {
      setSelectedFile(file);
      setUploadStatus("");
      setUploadProgress(0);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    };

    // مدیریت رویدادهای drag & drop
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]); // فقط اولین فایل رو انتخاب می‌کنیم
      }
    };

    const stopCamera = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
      setIsVideoReady(false);
    };

    const startCamera = async () => {
      setCameraError(null);
      setIsVideoReady(false);
      setIsCameraOpen(true);
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = "دسترسی به دوربین در این مرورگر پشتیبانی نمی‌شود";
        setCameraError(message);
        toast.error(message);
        return;
      }

      setIsStartingCamera(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            const video = videoRef.current;
            if (!video) return resolve();
            const onReady = async () => {
              try {
                await video.play();
              } catch (err) {
                console.error("پخش ویدیو ناکام ماند:", err);
              }
              setIsVideoReady(true);
              video.removeEventListener("loadedmetadata", onReady);
              resolve();
            };
            video.addEventListener("loadedmetadata", onReady);
          });
        }
        streamRef.current = stream;
        setTimeout(() => setIsVideoReady(true), 500); // اطمینان از آماده شدن تصویر
      } catch (error) {
        console.error("اشکال در راه‌اندازی دوربین:", error);
        const message = "باز کردن دوربین ممکن نشد";
        setCameraError(message);
        toast.error(message);
      } finally {
        setIsStartingCamera(false);
      }
    };

    const capturePhoto = () => {
      if (!videoRef.current) return;
      if (!isVideoReady) {
        toast.error("کمی صبر کنید تا تصویر دوربین آماده شود");
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || video.clientWidth || 1280;
      const height = video.videoHeight || video.clientHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: blob.type,
          });
          handleFileSelect(file);
          stopCamera();
        },
        "image/jpeg",
        0.9
      );
    };

    useEffect(() => {
      return () => {
        stopCamera();
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      };
    }, []);

    const handleToggleCamera = () => {
      if (isStartingCamera) return;
      if (isCameraOpen) {
        stopCamera();
      } else {
        startCamera();
      }
    };

    const handleCapture = () => {
      if (isStartingCamera) return;
      capturePhoto();
    };

    const handleKeyActivate = (
      e: React.KeyboardEvent<HTMLDivElement>,
      action: () => void
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    };

    const clearSelection = () => {
      setSelectedFile(null);
      setUploadStatus("");
      setUploadProgress(0);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    useImperativeHandle(ref, () => ({
      getFile: () => selectedFile,
      clearFile: () => {
        clearSelection();
        stopCamera();
      },
      uploadFile: async () => {
        if (!selectedFile) {
          setUploadStatus("لطفا یک فایل انتخاب کنید");
          return;
        }
        if (!orderNumber) {
          setUploadStatus("شماره سفارش معتبر نیست");
          return;
        }

        const cleanOrderNumber = orderNumber.replace(/[#%*<>?/\\|]/g, "_");
        const isCheckPic =
          title === "تصویر چک" || title === "تصویر چک (الزامی)";
        const subTypeFolder = isCheckPic ? "checkPic" : "checkPicConfirm";
        const webUrl = "https://crm.zarsim.com";
        const libraryName = "customer_checks";
        const fullFolderPath = `${libraryName}/${cleanOrderNumber}/${subFolder}/${subTypeFolder}`;

        try {
          const contextInfo = await fetch(`${webUrl}/_api/contextinfo`, {
            method: "POST",
            headers: { Accept: "application/json;odata=verbose" },
          });
          const data = await contextInfo.json();
          const digest = data.d.GetContextWebInformation.FormDigestValue;

          const createFolder = (path: string) =>
            fetch(`${webUrl}/_api/web/folders/add('${path}')`, {
              method: "POST",
              headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": digest,
              },
            }).catch((err) => {
              console.error("ایجاد پوشه ناموفق بود:", err.message);
            });

          await createFolder(`${libraryName}/${cleanOrderNumber}`);
          await createFolder(`${libraryName}/${cleanOrderNumber}/${subFolder}`);
          await createFolder(fullFolderPath);

          const cleanFileName = selectedFile.name.replace(/[#%*<>?/\\|]/g, "_");
          const arrayBuffer = await selectedFile.arrayBuffer();

          const uploadRes = await fetch(
            `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${fullFolderPath}')/Files/add(overwrite=true, url='${cleanFileName}')`,
            {
              method: "POST",
              body: arrayBuffer,
              headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": digest,
              },
            }
          );

          if (uploadRes.ok) {
            toast.success(`فایل ${selectedFile.name} با موفقیت آپلود شد`);
            setUploadStatus("فایل با موفقیت آپلود شد");
            setUploadProgress(100);
          } else {
            throw new Error("خطا در آپلود فایل");
          }
        } catch (error) {
          console.error("خطا در آپلود:", error);
          toast.error("خطا در آپلود فایل");
          setUploadStatus("خطا در آپلود فایل");
          setUploadProgress(0);
        }
      },
      hasFile: () => selectedFile !== null, // ✅ اضافه‌شده برای بررسی اجباری بودن فایل
    }));

    return (
      <div
        className={`flex flex-col justify-between items-end gap-5 px-4 py-1.5 rounded-md border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor={inputId}
          className="rounded-md p-2 flex justify-center items-center font-bold text-xs border-2 cursor-pointer transition-colors duration-300 gap-2"
        >
          {title}
          <Paperclip width={14} height={14} />
        </label>

        <input
          id={inputId}
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex w-full justify-end gap-3">
          <div
            role="button"
            tabIndex={0}
            aria-pressed={isCameraOpen}
            aria-disabled={isStartingCamera}
            onClick={handleToggleCamera}
            onKeyDown={(e) => handleKeyActivate(e, handleToggleCamera)}
            className={clsx(
              "btn btn-sm btn-outline",
              isStartingCamera && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
          >
            {isCameraOpen ? "بستن دوربین" : "باز کردن دوربین"}
          </div>
          {isCameraOpen && (
            <div
              role="button"
              tabIndex={0}
              aria-disabled={isStartingCamera}
              onClick={handleCapture}
              onKeyDown={(e) => handleKeyActivate(e, handleCapture)}
              className={clsx(
                "btn btn-sm btn-primary",
                isStartingCamera && "opacity-60 cursor-not-allowed pointer-events-none"
              )}
            >
              ثبت عکس لحظه‌ای
            </div>
          )}
        </div>

        {isCameraOpen && (
          <div className="w-full flex flex-col gap-2 items-end">
            <video
              ref={videoRef}
              className="w-full h-64 rounded-md border border-gray-200 bg-black object-contain"
              autoPlay
              muted
              playsInline
            />
            <p className="text-xs text-gray-500">
              دوربین USB را متصل کنید و پس از ثبت، تصویر به عنوان فایل انتخاب
              می‌شود.
            </p>
          </div>
        )}

        {cameraError && (
          <p className="text-xs text-red-600 font-semibold text-right w-full">
            {cameraError}
          </p>
        )}

        {selectedFile ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">{selectedFile.name}</p>
            <button
              type="button"
              onClick={() => {
                clearSelection();
                stopCamera();
              }}
              aria-label="پاک کردن فایل"
              className="w-[30px] h-[30px] flex items-center justify-center bg-red-600 text-white rounded-md text-lg font-bold cursor-pointer transition-colors duration-300 hover:bg-white hover:text-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-base-content mb-1">
              هنوز فایلی انتخاب نشده
            </p>
            <p className="text-xs text-gray-500">
              فایل را اینجا بکشید یا روی دکمه کلیک کنید
            </p>
          </div>
        )}

        {previewUrl && (
          <div className="w-full flex flex-col gap-2 items-end">
            <p className="text-xs text-gray-500">پیش‌نمایش تصویر</p>
            <img
              src={previewUrl}
              alt="preview"
              className="w-full max-h-64 object-contain rounded-md border border-gray-200 bg-white"
            />
          </div>
        )}

        {uploadStatus && (
          <div
            className={`font-bold ${
              uploadProgress === 100 ? "text-green-700" : "text-red-700"
            }`}
          >
            {uploadStatus}
          </div>
        )}
      </div>
    );
  }
);

export { FileUploader };
