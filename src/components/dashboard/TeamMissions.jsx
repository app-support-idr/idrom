import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, CalendarClock } from 'lucide-react';
import moment from 'moment';
import { getUpcomingMissions, missionDurationDays } from '@/utils/missionStats';

export default function TeamMissions({ missions }) {
  const { current, upcoming } = getUpcomingMissions(missions);

  return (
    <Card className="rounded-2xl shadow-lg border border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <Users className="w-5 h-5 text-indigo-600" />
          Vue équipe — Missions en cours & à venir
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> En cours actuellement ({current.length})
          </p>
          {current.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune mission en cours</p>
          ) : (
            <div className="space-y-2">
              {current.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.nom_prenom}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {m.lieu_destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      jusqu'au {moment(m.date_heure_arrivee).format('DD/MM HH:mm')}
                    </p>
                    <p className="text-xs text-green-700 font-medium">{missionDurationDays(m)} jour(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" /> À venir ({upcoming.length})
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune mission à venir</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.nom_prenom}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {m.lieu_destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {moment(m.date_heure_depart).format('DD/MM HH:mm')}
                    </p>
                    <p className="text-xs text-indigo-700 font-medium">{missionDurationDays(m)} jour(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}