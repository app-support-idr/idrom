import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  TrendingUp,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  FileText,
  History,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import moment from 'moment';
import KpiCard from './KpiCard';
import PeriodFilter from './PeriodFilter';
import TeamMissions from './TeamMissions';
import {
  filterByPeriod,
  countByStatus,
  computeApprovalRate,
  computeAvgProcessingDays,
  STATUS_COLORS,
  STATUS_BADGE_CLASS,
  STATUSES,
  missionDurationDays,
} from '@/utils/missionStats';

export default function DemandeurDashboard({ myMissions, allMissions, onSelectMission, onGoToTab }) {
  const [period, setPeriod] = useState('year');

  const periodMissions = filterByPeriod(myMissions, period);
  const statusCounts = countByStatus(periodMissions);
  const inProgress = myMissions.filter(
    (m) => m.status === 'En cours de validation' || m.status === 'En attente' || m.status === 'Demande de modification'
  );
  const alerts = myMissions.filter(
    (m) => m.status === 'Rejetée' || m.status === 'Demande de modification'
  );
  const upcomingMine = myMissions
    .filter((m) => m.status === 'Validée' && m.date_heure_depart && moment(m.date_heure_depart).isAfter(moment()))
    .sort((a, b) => new Date(a.date_heure_depart) - new Date(b.date_heure_depart));
  const recent = [...myMissions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  const avgDelay = computeAvgProcessingDays(myMissions);
  const approvalRate = computeApprovalRate(myMissions);

  const chartData = STATUSES.map((s) => ({ name: s, count: statusCounts[s] || 0, fill: STATUS_COLORS[s] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Mon tableau de bord</h2>
          <p className="text-sm text-slate-500">Suivi de vos demandes d'ordre de mission</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Clock}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Délai moyen de traitement"
          value={`${avgDelay} j`}
          sublabel="de la demande à la décision"
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label="Taux d'approbation"
          value={`${approvalRate}%`}
          sublabel="de mes demandes décidées"
        />
        <KpiCard
          icon={ClipboardList}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Demandes en cours"
          value={inProgress.length}
          onClick={() => onGoToTab && onGoToTab('my-requests')}
        />
        <KpiCard
          icon={FileText}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Total demandes"
          value={myMissions.length}
          sublabel={period === 'all' ? 'toutes périodes' : `sur ${period === 'month' ? 'le mois' : period === 'quarter' ? 'le trimestre' : "l'année"}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut de mes demandes en cours */}
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              Mes demandes en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inProgress.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune demande en cours</p>
            ) : (
              <div className="space-y-2">
                {inProgress.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => onSelectMission(m)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.lieu_destination}</p>
                      <p className="text-xs text-slate-500">
                        {moment(m.date_heure_depart).format('DD/MM/YYYY')} · {m.numero_om}
                      </p>
                    </div>
                    <Badge className={`border ${STATUS_BADGE_CLASS[m.status]}`}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prochaines missions */}
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Mes prochaines missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMine.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune mission à venir</p>
            ) : (
              <div className="space-y-2">
                {upcomingMine.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3 cursor-pointer hover:bg-indigo-100"
                    onClick={() => onSelectMission(m)}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.lieu_destination}</p>
                      <p className="text-xs text-slate-500">{m.motif_mission}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-700 font-medium">
                        {moment(m.date_heure_depart).format('DD/MM/YYYY')}
                      </p>
                      <p className="text-xs text-slate-500">{missionDurationDays(m)} jour(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historique récent */}
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <History className="w-5 h-5 text-slate-600" />
              Historique récent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune demande</p>
            ) : (
              <div className="space-y-2">
                {recent.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => onSelectMission(m)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.lieu_destination}</p>
                      <p className="text-xs text-slate-500">
                        {moment(m.date_heure_depart).format('DD/MM/YYYY')} · {m.numero_om}
                      </p>
                    </div>
                    <Badge className={`border ${STATUS_BADGE_CLASS[m.status]}`}>{m.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card className={`rounded-2xl shadow-lg border ${alerts.length > 0 ? 'border-red-200' : 'border-slate-100'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertes — Décisions des valideurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Aucune alerte</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-slate-50 ${
                      m.status === 'Rejetée' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                    }`}
                    onClick={() => onSelectMission(m)}
                  >
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${m.status === 'Rejetée' ? 'text-red-500' : 'text-orange-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {m.status === 'Rejetée' ? 'Demande rejetée' : 'Modification demandée'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.lieu_destination} — {moment(m.date_heure_depart).format('DD/MM/YYYY')}
                      </p>
                      {m.validation_history && m.validation_history.length > 0 && (
                        <p className="text-xs text-slate-400 italic mt-1">
                          {m.validation_history[m.validation_history.length - 1].comment || ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nombre de missions par statut (period) */}
      <Card className="rounded-2xl shadow-lg border border-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-800">
            Nombre de mes missions par statut
          </CardTitle>
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

      {/* Vue équipe */}
      <TeamMissions missions={allMissions} />
    </div>
  );
}