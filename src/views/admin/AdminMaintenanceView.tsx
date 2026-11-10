import React, { useState } from "react"
import type { MaintenanceLog, Car } from "../../types"
import { WrenchIcon, PlusIcon, CarIcon, CalendarIcon } from "../../components/Icons"

interface AdminMaintenanceViewProps {
  logs: MaintenanceLog[]
  cars: Car[]
  onCreateLog: (data: {
    carId: string
    serviceType: string
    cost: number
    odometer: number
    date: string
    status: "Completed" | "Scheduled" | "In Progress"
    technicianNotes: string
  }) => Promise<void>
}

export default function AdminMaintenanceView({
  logs,
  cars,
  onCreateLog,
}: AdminMaintenanceViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id || "")
  const [serviceType, setServiceType] = useState("Oil & Filter Change")
  const [cost, setCost] = useState(120)
  const [odometer, setOdometer] = useState<number>(15000)
  const [status, setStatus] = useState<"Completed" | "Scheduled" | "In Progress">("Completed")
  const [technicianNotes, setTechnicianNotes] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCarId) {
      alert("Please select a vehicle.")
      return
    }
    setIsBusy(true)
    try {
      await onCreateLog({
        carId: selectedCarId,
        serviceType,
        cost,
        odometer,
        date: new Date().toISOString().split("T")[0],
        status,
        technicianNotes: technicianNotes.trim() || serviceType,
      })
      setTechnicianNotes("")
      setCost(120)
      setIsModalOpen(false)
    } finally {
      setIsBusy(false)
    }
  }

  const totalMaintenanceCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Vehicle Telemetry & Maintenance Audit
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Log routine garage services, track repair expenditure, and ensure fleet roadworthiness.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const car = cars.find((c) => c.id === selectedCarId) || cars[0]
            if (car && car.currentOdometer) setOdometer(car.currentOdometer)
            setIsModalOpen(true)
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <PlusIcon size={14} />
          <span>+ Log Service Entry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Service Records
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{logs.length}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Garage work orders logged</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Maintenance Cost
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            €{totalMaintenanceCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Fleet servicing expenditure</div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Fleet Vehicles Covered
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{cars.length}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Active vehicles in roster</div>
        </div>
      </div>

      {/* Maintenance Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
          <WrenchIcon size={32} className="mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-800">No maintenance records logged</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Click "+ Log Service Entry" to record oil changes, brake inspections, or tire replacements.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4">Workshop Notes</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => {
                  const car = cars.find((c) => c.id === log.carId)
                  return (
                    <tr key={log.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {log.date || "Recent"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">
                          {car ? car.name : log.carName || "Vehicle"}
                        </div>
                        {car?.plateNumber && (
                          <div className="text-[10px] font-mono text-stone-500">
                            {car.plateNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-800">
                        {log.serviceType || "Inspection"}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {log.odometer ? `${log.odometer.toLocaleString()} km` : "—"}
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {log.technicianNotes || "Routine servicing"}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-emerald-700">
                        €{log.cost || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {log.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Service Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">
                Log New Vehicle Service
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Select Vehicle
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => {
                    setSelectedCarId(e.target.value)
                    const c = cars.find((car) => car.id === e.target.value)
                    if (c && c.currentOdometer) setOdometer(c.currentOdometer)
                  }}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.plateNumber || "No Plate"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Service Category
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                >
                  <option value="Oil & Filter Change">Oil & Filter Change</option>
                  <option value="Brake Pad & Rotor Replacement">Brake Pad & Rotor Replacement</option>
                  <option value="Tire Rotation & Alignment">Tire Rotation & Alignment</option>
                  <option value="Scheduled 15,000 km Inspection">Scheduled 15,000 km Inspection</option>
                  <option value="Interior Deep Detailing">Interior Deep Detailing</option>
                  <option value="Body & Paint Scratch Touch-up">Body & Paint Scratch Touch-up</option>
                  <option value="Battery Diagnostics">Battery Diagnostics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Cost (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 text-xs font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-3 text-xs font-mono font-bold bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Technician Notes & Findings
                </label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="e.g. Completed by Authorized Service Center. Replaced synthetic 5W-30 oil."
                  className="w-full p-2.5 text-xs bg-stone-50 rounded-lg border border-stone-200 text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
                >
                  {isBusy ? "Saving..." : "Record Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
