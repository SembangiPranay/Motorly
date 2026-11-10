import React from "react"
import { CheckIcon, UploadIcon } from "../../components/Icons"

interface DriverData {
  licenseNumber: string
  licenseState: string
  licenseExpiry: string
  dateOfBirth: string
}

interface CheckoutDriverIdFormProps {
  driver: DriverData
  setDriver: React.Dispatch<React.SetStateAction<DriverData>>
  maxDobStr: string
  minExpiryStr: string
  uploadedFrontDataUrl: string | null
  uploadedFile: string | null
  uploadedBackDataUrl: string | null
  uploadedBackFile: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  fileBackInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, isBack: boolean) => void
}

export default function CheckoutDriverIdForm({
  driver,
  setDriver,
  maxDobStr,
  minExpiryStr,
  uploadedFrontDataUrl,
  uploadedFile,
  uploadedBackDataUrl,
  uploadedBackFile,
  fileInputRef,
  fileBackInputRef,
  onFileChange,
}: CheckoutDriverIdFormProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          2
        </span>
        <div>
          <h2 className="text-base font-bold text-[#17191C] font-heading">
            Driver's License &amp; Identity Verification
          </h2>
          <p className="text-[11px] text-stone-400">
            Required for vehicle security and garage key handover verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>
              Date of Birth (18+ Only) <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">
              Must be 18+
            </span>
          </label>
          <input
            type="date"
            required
            max={maxDobStr}
            value={driver.dateOfBirth}
            onChange={(e) =>
              setDriver((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Driver's License Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. D123-456-789-0"
            value={driver.licenseNumber}
            onChange={(e) =>
              setDriver((prev) => ({ ...prev, licenseNumber: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Issuing State / Country <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. FL (Florida) or USA"
            value={driver.licenseState}
            onChange={(e) =>
              setDriver((prev) => ({ ...prev, licenseState: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>
              License Expiration Date <span className="text-rose-500">*</span>
            </span>
            <span className="text-[10px] text-stone-400 font-normal">
              Valid through trip
            </span>
          </label>
          <input
            type="date"
            required
            min={minExpiryStr}
            value={driver.licenseExpiry}
            onChange={(e) =>
              setDriver((prev) => ({ ...prev, licenseExpiry: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>
      </div>

      {/* Upload License Dual Drag & Drop Zone */}
      <div className="pt-2 space-y-3">
        <label className="block text-xs font-bold text-stone-700">
          Driver Identification Photos (Front &amp; Back){" "}
          <span className="text-rose-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Front License */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => onFileChange(e, false)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 hover:border-[#F97316] rounded-xl p-4 text-center cursor-pointer bg-stone-50/50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center space-y-1.5 group"
            >
              {uploadedFrontDataUrl ? (
                <div className="w-full flex items-center gap-3">
                  <img
                    src={uploadedFrontDataUrl}
                    alt="Driver License Front"
                    className="w-20 h-14 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckIcon size={12} /> Front Captured
                    </p>
                    <p className="text-[10px] text-stone-500 truncate font-mono">
                      {uploadedFile}
                    </p>
                    <span className="text-[10px] text-orange-600 font-semibold hover:underline">
                      Replace photo
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-stone-400 group-hover:text-[#F97316] transition-colors">
                    <UploadIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      {uploadedFile ? (
                        <span className="text-emerald-600 flex items-center gap-1 justify-center">
                          <CheckIcon size={12} /> Front: {uploadedFile}
                        </span>
                      ) : (
                        "Upload License Front"
                      )}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Driver License Front Side
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Back License */}
          <div>
            <input
              ref={fileBackInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => onFileChange(e, true)}
            />
            <div
              onClick={() => fileBackInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 hover:border-[#F97316] rounded-xl p-4 text-center cursor-pointer bg-stone-50/50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center space-y-1.5 group"
            >
              {uploadedBackDataUrl ? (
                <div className="w-full flex items-center gap-3">
                  <img
                    src={uploadedBackDataUrl}
                    alt="Driver License Back"
                    className="w-20 h-14 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckIcon size={12} /> Back Captured
                    </p>
                    <p className="text-[10px] text-stone-500 truncate font-mono">
                      {uploadedBackFile}
                    </p>
                    <span className="text-[10px] text-orange-600 font-semibold hover:underline">
                      Replace photo
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-stone-400 group-hover:text-[#F97316] transition-colors">
                    <UploadIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      {uploadedBackFile ? (
                        <span className="text-emerald-600 flex items-center gap-1 justify-center">
                          <CheckIcon size={12} /> Back: {uploadedBackFile}
                        </span>
                      ) : (
                        "Upload License Back"
                      )}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Driver License Back Barcode
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-stone-500">
          Stored securely. Operations Manager will inspect and verify credentials at garage pickup.
        </p>
      </div>
    </div>
  )
}
