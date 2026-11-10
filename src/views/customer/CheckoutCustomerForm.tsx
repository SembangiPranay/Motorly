import React from "react"

interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface CheckoutCustomerFormProps {
  customer: CustomerData
  setCustomer: React.Dispatch<React.SetStateAction<CustomerData>>
}

export default function CheckoutCustomerForm({
  customer,
  setCustomer,
}: CheckoutCustomerFormProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
        <span className="w-7 h-7 rounded-lg bg-[#17191C] text-white text-xs font-black flex items-center justify-center">
          1
        </span>
        <div>
          <h2 className="text-base font-bold text-[#17191C] font-heading">
            Primary Customer Information
          </h2>
          <p className="text-[11px] text-stone-400">
            Confirmation vouchers and garage pickup notifications are delivered to this address.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customer.firstName}
            onChange={(e) =>
              setCustomer((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customer.lastName}
            onChange={(e) =>
              setCustomer((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            value={customer.email}
            onChange={(e) =>
              setCustomer((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={customer.phone}
            onChange={(e) =>
              setCustomer((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-stone-50/50 text-stone-900"
          />
        </div>
      </div>
    </div>
  )
}
