import { AlertTriangle, Hammer, Clock } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center">
          <div className="bg-amber-100 p-4 rounded-full">
            <Hammer className="h-12 w-12 text-amber-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Under Maintenance</h1>
          <p className="text-slate-500 text-lg">
            Alfred is currently undergoing scheduled improvements to serve you better.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 text-left">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Estimated Duration</p>
            <p className="text-sm text-slate-500">We expect to be back online shortly.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 text-amber-600 font-medium">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm uppercase tracking-wider">Production Update in Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
