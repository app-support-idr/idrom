import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sublabel, onClick }) {
  return (
    <Card
      className={`rounded-2xl shadow-lg border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`p-3 rounded-xl ${iconBg}`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-800 truncate">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
            {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}