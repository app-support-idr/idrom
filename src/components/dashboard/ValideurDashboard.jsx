import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Inbox,
  AlertTriangle,
  TrendingDown,
  MapPin,
  Tag,
  Coins,
  Route,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import moment from 'moment';
import KpiCard from './KpiCard';
import PeriodFilter from './PeriodFilter';
import TeamMissions from './TeamMissions';
import {
  filterByPeriod,
  countByStatus,
  computeApprovalRate,
  computeRejectionRate,
  computeAvgValidationDays,
  computeAvgEndToEndDays,
  computeTotalCost,
  computeCostBreakdown,
  topDestinations,
  topMotifs,
  getPendingForTooLong,
  sortByDepartureUrgency,
  formatAr,
  STATUS_COLORS,
  STATUSES,
} from '@/utils/missionStats';

const PIE_COLORS = ['#6366f1', '#f59e0b'];

export default function ValideurDashboard({ allMissions, pendingMissions, userProfile, onSelectMission, onGoToTab }) {
  const [period, setPeriod] = useState('year');

  const periodMissions = filterByPeriod(allMissions, period);
  const validatedInPeriod = periodMissions.filter((m) => m.status === 'Validée');
  const statusCounts = countByStatus(periodMissions);

  const avgValidationDays = computeAvgValidationDays(allMissions, userProfile?.currentProfile);
  const approvalRate = computeApprovalRate(allMissions);
  const rejectionRate = computeRejectionRate(allMissions);
  const totalCost = computeTotalCost(validatedInPeriod);
  const avgEndToEnd = computeAvgEndToEndDays(allMissions);
  const avgCostPerMission = validatedInPeriod.length > 0 ? Math.round(totalCost / validatedInPeriod.length) : 0;

  const costBreakdown = computeCostBreakdown(validatedInPeriod);
  const costData = [
    { name: 'Hébergement', value: costBreakdown.hebergement },
    { name: 'Repas', value: costBreakdown.repas },
  ];

  const destinations = topDestinations(periodMissions, 5);
  const motifs = topMotifs(periodMissions, 5);

  const urgentQueue = sortByDepartureUrgency(pendingMissions);
  const tooLong = getPendingForTooLong(allMissions, 3).filter((m) =>
    pendingMissions.some((p) => p.id === m.id)
  );

  const chartData = STATUSES.map((s) => ({ name: s, count: statusCounts[s] || 0, fill: STATUS_COLORS[s] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Tableau de bord validateur</h2>
          <p className="text-sm text-slate-500">Pilotage des validations et des coûts ({userProfile?.currentProfile})</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Clock}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Délai moyen de validation"
          value={`${avgValidationDays} j`}
          sublabel="soumission → ma décision"
        />
        <KpiCard
          icon={Inbox}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Demandes en attente"
          value={pendingMissions.length}
          onClick={() => onGoToTab && onGoToTab('validation')}
        />
        <KpiCard
          icon={CheckCircle2}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Taux d'approbation"
          value={`${approvalRate}%`}
          sublabel={`Rejet : ${rejectionRate}%`}
        />
        <KpiCard
          icon={DollarSign}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Coût total validé"
          value={formatAr(totalCost)}
          sublabel="missions validées (période)"
        />
      </div>

      {/* File d'attente + en attente trop longtemps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <Inbox className="w-5 h-5 text-amber-600" />
              File d'attente à valider (par urgence)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentQueue.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune demande en attente</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {urgentQueue.map((m, idx) => {
                  const daysLeft = Math.ceil(moment(m.date_heure_depart).diff(moment(), 'hours', true) / 24);
                  const urgent = daysLeft <= 2;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-100"
                      onClick={() => onSelectMission(m)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {m.nom_prenom} — {m.lieu_destination}
                        </p>
                        <p className="text-xs text-slate-500">
                          Départ : {moment(m.date_heure_depart).format('DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                      <Badge className={urgent ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}>
                        {daysLeft <= 0 ? 'Imminent' : `${daysLeft}j`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`rounded-2xl shadow-lg border ${tooLong.length > 0 ? 'border-red-200' : 'border-slate-100'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              En attente depuis plus de 3 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tooLong.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune demande en retard</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {tooLong.map((m) => {
                  const daysWaiting = Math.floor(moment().diff(moment(m.created_date), 'days'));
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100"
                      onClick={() => onSelectMission(m)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.nom_prenom}</p>
                        <p className="text-xs text-slate-500">{m.lieu_destination}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border border-red-200">{daysWaiting}j</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nombre de missions par statut */}
      <Card className="rounded-2xl shadow-lg border border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-800">Nombre de missions par statut (période)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
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

      {/* Coûts + répartition dépenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="grid grid-cols-1 gap-4">
          <KpiCard
            icon={Coins}
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
            label="Coût moyen par mission"
            value={formatAr(avgCostPerMission)}
          />
          <KpiCard
            icon={Route}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            label="Délai moyen bout en bout"
            value={`${avgEndToEnd} j`}
            sublabel="demande → clôture"
          />
        </div>
        <Card className="rounded-2xl shadow-lg border border-slate-100 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-800">Répartition des dépenses (missions validées)</CardTitle>
          </CardHeader>
          <CardContent>
            {costBreakdown.total === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune dépense sur la période</p>
            ) : (
              <div className="flex items-center gap-6 flex-wrap">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
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
      </div>

      {/* Top destinations & motifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="space-y-2">
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

      {/* Vue équipe */}
      <TeamMissions missions={allMissions} />
    </div>
  );
}