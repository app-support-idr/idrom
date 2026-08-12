import moment from 'moment';

export const STATUSES = [
  'En attente',
  'En cours de validation',
  'Validée',
  'Rejetée',
  'Demande de modification',
];

export const STATUS_COLORS = {
  'Validée': '#16a34a',
  'Rejetée': '#dc2626',
  'En cours de validation': '#f59e0b',
  'En attente': '#64748b',
  'Demande de modification': '#ea580c',
};

export const STATUS_BADGE_CLASS = {
  'Validée': 'bg-green-100 text-green-700 border-green-200',
  'Rejetée': 'bg-red-100 text-red-700 border-red-200',
  'En cours de validation': 'bg-amber-100 text-amber-700 border-amber-200',
  'En attente': 'bg-slate-100 text-slate-700 border-slate-200',
  'Demande de modification': 'bg-orange-100 text-orange-700 border-orange-200',
};

export const REFACTURATION_STATUSES = ['A faire', 'Envoyé', 'Annulé'];

const TARIFS_INTERNE = {
  'DG': { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
  'Directeur': { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
  'Responsable': { petit_dej: 10000, dejeuner: 20000, diner: 20000, hebergement: 80000 },
  'Agent spécialisé': { petit_dej: 5000, dejeuner: 10000, diner: 15000, hebergement: 45000 },
  'Agent': { petit_dej: 5000, dejeuner: 8000, diner: 7000, hebergement: 35000 },
};

const TARIFS_EVENEMENT = {
  'Responsable': 20000,
  'Agent spécialisé': 10000,
  'Agent': 50000,
};

const TARIFS_TIERS = {
  'DG': 265000,
  'Directeur': 195000,
  'Responsable': 130000,
  'Agent spécialisé': 75000,
};

export function formatAr(montant) {
  return (montant || 0).toLocaleString('fr-FR') + ' Ar';
}

export function computeIndemnitesBreakdown(mission) {
  const fonction = mission.fonction;
  const categorie = mission.categorie_mission;
  const dateDepart = mission.date_heure_depart;
  const dateArrivee = mission.date_heure_arrivee;
  let hebergement = 0, repas = 0;

  if (!fonction || !categorie || !dateDepart || !dateArrivee) return { hebergement, repas, total: 0 };

  const depart = new Date(dateDepart);
  const arrivee = new Date(dateArrivee);
  if (arrivee <= depart) return { hebergement, repas, total: 0 };

  const days = [];
  let currentDate = new Date(depart);
  currentDate.setHours(0, 0, 0, 0);
  const endDate = new Date(arrivee);
  endDate.setHours(0, 0, 0, 0);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const departHour = depart.getHours();
  const arriveeHour = arrivee.getHours();

  if (categorie === 'Interne') {
    const tarifs = TARIFS_INTERNE[fonction];
    if (!tarifs) return { hebergement, repas, total: 0 };
    days.forEach((day, index) => {
      const isFirstDay = index === 0;
      const isLastDay = index === days.length - 1;
      let pj = 0, dej = 0, din = 0, heb = 0;
      if (isFirstDay && isLastDay) {
        pj = departHour < 5 ? tarifs.petit_dej : 0;
        dej = (departHour < 12 && arriveeHour >= 12) ? tarifs.dejeuner : 0;
        din = arriveeHour >= 19 ? tarifs.diner : 0;
      } else if (isFirstDay) {
        pj = departHour < 5 ? tarifs.petit_dej : 0;
        dej = departHour < 12 ? tarifs.dejeuner : 0;
        din = departHour < 19 ? tarifs.diner : 0;
        heb = tarifs.hebergement;
      } else if (isLastDay) {
        pj = arriveeHour >= 5 ? tarifs.petit_dej : 0;
        dej = arriveeHour >= 12 ? tarifs.dejeuner : 0;
        din = arriveeHour >= 19 ? tarifs.diner : 0;
      } else {
        pj = tarifs.petit_dej;
        dej = tarifs.dejeuner;
        din = tarifs.diner;
        heb = tarifs.hebergement;
      }
      repas += pj + dej + din;
      hebergement += heb;
    });
  } else {
    const tarifJour = categorie === 'Evenement(foire, salon)' ? TARIFS_EVENEMENT[fonction] : TARIFS_TIERS[fonction];
    if (!tarifJour) return { hebergement, repas, total: 0 };
    repas = days.length * tarifJour;
  }

  return { hebergement, repas, total: hebergement + repas };
}

export function getMissionTotal(mission) {
  if (mission.total_indemnites) return mission.total_indemnites;
  return computeIndemnitesBreakdown(mission).total;
}

export function filterByPeriod(missions, period) {
  if (period === 'all') return missions;
  const now = moment();
  let start;
  if (period === 'month') start = now.clone().startOf('month');
  else if (period === 'quarter') start = now.clone().startOf('quarter');
  else if (period === 'year') start = now.clone().startOf('year');
  return missions.filter((m) => {
    const d = moment(m.date_heure_depart || m.created_date);
    return d.isSameOrAfter(start);
  });
}

export function countByStatus(missions) {
  const counts = {};
  STATUSES.forEach((s) => (counts[s] = 0));
  missions.forEach((m) => {
    counts[m.status] = (counts[m.status] || 0) + 1;
  });
  return counts;
}

export function countByRefacturation(missions) {
  const counts = {};
  REFACTURATION_STATUSES.forEach((s) => (counts[s] = 0));
  missions.filter((m) => m.a_refacturer).forEach((m) => {
    const s = m.statut_refacturation || 'A faire';
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

export function computeApprovalRate(missions) {
  const decided = missions.filter((m) => m.status === 'Validée' || m.status === 'Rejetée');
  if (decided.length === 0) return 0;
  const approved = missions.filter((m) => m.status === 'Validée').length;
  return Math.round((approved / decided.length) * 100);
}

export function computeRejectionRate(missions) {
  const decided = missions.filter((m) => m.status === 'Validée' || m.status === 'Rejetée');
  if (decided.length === 0) return 0;
  const rejected = missions.filter((m) => m.status === 'Rejetée').length;
  return Math.round((rejected / decided.length) * 100);
}

export function computeAvgProcessingDays(missions) {
  const completed = missions.filter((m) => m.validation_history && m.validation_history.length > 0 && m.created_date);
  if (completed.length === 0) return 0;
  const totalDays = completed.reduce((sum, m) => {
    const last = m.validation_history[m.validation_history.length - 1];
    return sum + moment(last.date).diff(moment(m.created_date), 'hours', true) / 24;
  }, 0);
  return Math.round((totalDays / completed.length) * 10) / 10;
}

export function computeAvgValidationDays(missions, validatorProfile) {
  const filtered = missions.filter((m) => m.validation_history && m.created_date);
  const relevant = validatorProfile
    ? filtered.filter((m) => m.validation_history.some((v) => v.validator_profile === validatorProfile))
    : filtered;
  if (relevant.length === 0) return 0;
  const totalDays = relevant.reduce((sum, m) => {
    const entry = validatorProfile
      ? m.validation_history.find((v) => v.validator_profile === validatorProfile)
      : m.validation_history[m.validation_history.length - 1];
    if (!entry) return sum;
    return sum + moment(entry.date).diff(moment(m.created_date), 'hours', true) / 24;
  }, 0);
  return Math.round((totalDays / relevant.length) * 10) / 10;
}

export function computeAvgEndToEndDays(missions) {
  const validated = missions.filter(
    (m) => m.status === 'Validée' && m.validation_history && m.validation_history.length > 0 && m.created_date
  );
  if (validated.length === 0) return 0;
  const totalDays = validated.reduce((sum, m) => {
    const last = m.validation_history[m.validation_history.length - 1];
    return sum + moment(last.date).diff(moment(m.created_date), 'hours', true) / 24;
  }, 0);
  return Math.round((totalDays / validated.length) * 10) / 10;
}

export function computeTotalCost(missions) {
  return missions.reduce((sum, m) => sum + getMissionTotal(m), 0);
}

export function computeCostBreakdown(missions) {
  let hebergement = 0, repas = 0;
  missions.forEach((m) => {
    const b = computeIndemnitesBreakdown(m);
    hebergement += b.hebergement;
    repas += b.repas;
  });
  return { hebergement, repas, total: hebergement + repas };
}

export function topItems(missions, field, n = 5) {
  const counts = {};
  missions.forEach((m) => {
    const val = m[field];
    if (val) counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

export function topDestinations(missions, n = 5) {
  return topItems(missions, 'lieu_destination', n);
}

export function topMotifs(missions, n = 5) {
  return topItems(missions, 'motif_mission', n);
}

export function getUpcomingMissions(missions) {
  const now = moment();
  const validated = missions.filter((m) => m.status === 'Validée' && m.date_heure_depart);
  const current = validated.filter(
    (m) => moment(m.date_heure_depart).isSameOrBefore(now) && moment(m.date_heure_arrivee).isSameOrAfter(now)
  );
  const upcoming = validated
    .filter((m) => moment(m.date_heure_depart).isAfter(now))
    .sort((a, b) => new Date(a.date_heure_depart) - new Date(b.date_heure_depart));
  return { current, upcoming };
}

export function getPendingForTooLong(missions, days = 3) {
  const now = moment();
  return missions.filter((m) => {
    if (m.status !== 'En cours de validation' && m.status !== 'En attente') return false;
    return now.diff(moment(m.created_date), 'days') >= days;
  });
}

export function sortByDepartureUrgency(missions) {
  return [...missions].sort((a, b) => new Date(a.date_heure_depart) - new Date(b.date_heure_depart));
}

export function missionDurationDays(mission) {
  if (!mission.date_heure_depart || !mission.date_heure_arrivee) return 0;
  const diff = moment(mission.date_heure_arrivee).diff(moment(mission.date_heure_depart), 'hours', true);
  return Math.max(1, Math.round(diff / 24));
}