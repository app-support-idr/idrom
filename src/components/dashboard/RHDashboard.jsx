import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  Layers,
  MapPin,
  Tag,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import moment from 'moment';
import KpiCard from './KpiCard';
import PeriodFilter from './PeriodFilter';
import {
  filterByPeriod,
  countByStatus,
  computeTotalCost,
  computeCostBreakdown,
  topDestinations,
  topMotifs,
  formatAr,
  STATUS_COLORS,
  STATUSES,
} from '@/utils/missionStats';

const PIE_COLORS = ['#6366f1', '#f59e0b'];

export default function RHDashboard({ allMissions, onSelectMission, onGoToTab }) {
  const [period, setPeriod] = useState('year');

  const periodMissions = filterByPeriod(allMissions, period);
  const statusCounts = countByStatus(periodMissions);
  const totalCost = computeTotalCost(periodMissions.filter((m) => m.status === 'Validée'));
  const costBreakdown = computeCostBreakdown(periodMissions.filter((m) => m.status === 'Validée'));

  const destinations = topDestinations(periodMissions, 5);
  const motifs = topMotifs(periodMissions, 5);

  const chartData = STATUSES.map((s) => ({ name: s, count: statusCounts[s] || 0, fill: STATUS_COLORS[s] }));
  const costData = [
    { name: 'Hébergement', value: costBreakdown.hebergement },
    { name: 'Repas', value: costBreakdown.repas },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Tableau de bord RH</h2>
          <p className="text-sm text-slate-500">Vue globale des ordres de mission</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={FileText}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Volume global des demandes"
          value={periodMissions.length}
          sublabel="sur la période sélectionnée"
        />
        <KpiCard
          icon={DollarSign}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Coût total des missions"
          value={formatAr(totalCost)}
          sublabel="missions validées"
        />
        <KpiCard
          icon={Layers}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Demandes validées"
          value={statusCounts['Validée'] || 0}
          onClick={() => onGoToTab && onGoToTab('validated')}
        />
        <KpiCard
          icon={FileText}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="En attente / en cours"
          value={(statusCounts['En attente'] || 0) + (statusCounts['En cours de validation'] || 0)}
        />
      </div>

      {/* Volume par statut */}
      <Card className="rounded-2xl shadow-lg border border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-800">Volume des demandes par statut (période)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="count" name="Demandes" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition des dépenses + top destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              Répartition des dépenses (validées)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.total === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune dépense sur la période</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                      {costData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatAr(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Hébergement</p>
                    <p className="text-lg font-bold text-indigo-600">{formatAr(costBreakdown.hebergement)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Repas</p>
                    <p className="text-lg font-bold text-amber-500">{formatAr(costBreakdown.repas)}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-xl font-bold text-slate-800">{formatAr(costBreakdown.total)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Top destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {destinations.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={destinations} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" name="Missions" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top motifs */}
      <Card className="rounded-2xl shadow-lg border border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <Tag className="w-5 h-5 text-amber-600" />
            Top motifs de mission
          </CardTitle>
        </CardHeader>
        <CardContent>
          {motifs.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune donnée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {motifs.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-sm text-slate-700 truncate pr-2">{m.name}</p>
                  <Badge className="bg-amber-100 text-amber-700">{m.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}