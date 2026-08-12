import React, { useMemo, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertCircle } from 'lucide-react';

const TARIFS_INTERNE = {
  'DG':             { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
  'Directeur':      { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
  'Responsable':    { petit_dej: 10000, dejeuner: 20000, diner: 20000, hebergement: 80000  },
  'Agent spécialisé': { petit_dej: 5000, dejeuner: 10000, diner: 15000, hebergement: 45000 },
  'Agent':          { petit_dej: 5000,  dejeuner: 8000,  diner: 7000,  hebergement: 35000  }
};

const TARIFS_EVENEMENT = {
  'Responsable': 20000,
  'Agent spécialisé': 10000,
  'Agent': 50000
};

const TARIFS_TIERS = {
  'DG': 265000,
  'Directeur': 195000,
  'Responsable': 130000,
  'Agent spécialisé': 75000
};

/**
 * IndemnityCalculator
 * Props:
 *   fonction, categorie, dateDepart, dateArrivee, showTotal
 *   matricule       — matricule du missionnaire (pour RG1/RG2)
 *   avecCouchette   — boolean (pour RG3)
 */
export default function IndemnityCalculator({
  fonction, categorie, dateDepart, dateArrivee,
  matricule = '', avecCouchette = false, showTotal = true
}) {
  const [beneficiaryFile, setBeneficiaryFile] = useState(null);
  const [loadingRules, setLoadingRules] = useState(true);

  useEffect(() => {
    base44.entities.EmployeeBeneficiary.list('-created_date', 1).then(files => {
      setBeneficiaryFile(files[0] || null);
      setLoadingRules(false);
    });
  }, []);

  // Déterminer les restrictions RG1 / RG2 / RG3
  const { noHebergement, noRepas, rgApplied } = useMemo(() => {
    const mat = String(matricule || '').trim();
    let noHeb = false;
    let noRep = false;
    const applied = [];

    if (mat && beneficiaryFile) {
      // Normalise : trim, lowercase, et aussi version numérique pour gérer "0029" == "29"
      const normalize = (v) => String(v).trim().toLowerCase();
      const toNum = (v) => { const n = parseInt(v, 10); return isNaN(n) ? null : String(n); };

      const matNorm = normalize(mat);
      const matNum  = toNum(mat);

      const matchesList = (list) => {
        const normed = (list || []).map(normalize);
        const nums   = (list || []).map(toNum);
        return normed.includes(matNorm) || (matNum !== null && nums.includes(matNum));
      };

      if (matchesList(beneficiaryFile.hebergement_repas)) {
        // RG1 : présent feuille 1 → pas d'hébergement ni de repas
        noHeb = true;
        noRep = true;
        applied.push('RG1');
      } else if (matchesList(beneficiaryFile.repas_seulement)) {
        // RG2 : présent feuille 2 → pas de repas, hébergement maintenu
        noRep = true;
        applied.push('RG2');
      }
    }

    if (avecCouchette) {
      // RG3 : pas d'hébergement
      noHeb = true;
      if (!applied.includes('RG3')) applied.push('RG3');
    }

    return { noHebergement: noHeb, noRepas: noRep, rgApplied: applied };
  }, [matricule, avecCouchette, beneficiaryFile]);

  const calculation = useMemo(() => {
    if (!fonction || !categorie || !dateDepart || !dateArrivee || loadingRules) return null;

    const depart  = new Date(dateDepart);
    const arrivee = new Date(dateArrivee);
    if (arrivee <= depart) return null;

    const days = [];
    let cur = new Date(depart);
    cur.setHours(0, 0, 0, 0);
    const endDate = new Date(arrivee);
    endDate.setHours(0, 0, 0, 0);
    while (cur <= endDate) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }

    const departHour  = depart.getHours();
    const arriveeHour = arrivee.getHours();

    if (categorie === 'Interne') {
      const tarifs = TARIFS_INTERNE[fonction];
      if (!tarifs) return null;

      const dailyData = days.map((day, index) => {
        const isFirst = index === 0;
        const isLast  = index === days.length - 1;
        const dateStr = day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });

        let petit_dej = 0, dejeuner = 0, diner = 0, hebergement = 0;

        if (isFirst && isLast) {
          petit_dej  = departHour < 5  ? tarifs.petit_dej : 0;
          dejeuner   = (departHour < 12 && arriveeHour >= 12) ? tarifs.dejeuner : 0;
          diner      = arriveeHour >= 19 ? tarifs.diner : 0;
          hebergement = 0;
        } else if (isFirst) {
          petit_dej  = departHour < 5  ? tarifs.petit_dej : 0;
          dejeuner   = departHour < 12 ? tarifs.dejeuner  : 0;
          diner      = departHour < 19 ? tarifs.diner     : 0;
          hebergement = tarifs.hebergement;
        } else if (isLast) {
          petit_dej  = arriveeHour >= 5  ? tarifs.petit_dej : 0;
          dejeuner   = arriveeHour >= 12 ? tarifs.dejeuner  : 0;
          diner      = arriveeHour >= 19 ? tarifs.diner     : 0;
          hebergement = 0;
        } else {
          petit_dej  = tarifs.petit_dej;
          dejeuner   = tarifs.dejeuner;
          diner      = tarifs.diner;
          hebergement = tarifs.hebergement;
        }

        // Appliquer RG1 / RG2 / RG3
        if (noRepas)      { petit_dej = 0; dejeuner = 0; diner = 0; }
        if (noHebergement) { hebergement = 0; }

        const total = petit_dej + dejeuner + diner + hebergement;
        return { date: dateStr, petit_dej, dejeuner, diner, hebergement, total };
      });

      const grandTotal = dailyData.reduce((sum, d) => sum + d.total, 0);
      return { type: 'interne', dailyData, grandTotal };

    } else if (categorie === 'Evenement(foire, salon)') {
      const tarifJour = TARIFS_EVENEMENT[fonction];
      if (!tarifJour) return { type: 'evenement', message: "Cette fonction ne bénéficie pas d'indemnités pour les événements", grandTotal: 0 };
      const nbJours    = days.length;
      const grandTotal = nbJours * tarifJour;
      return { type: 'evenement', nbJours, tarifJour, grandTotal };

    } else if (categorie === 'Tiers à charge') {
      const tarifJour = TARIFS_TIERS[fonction];
      if (!tarifJour) return { type: 'tiers', message: "Cette fonction ne bénéficie pas d'indemnités pour les missions tiers à charge", grandTotal: 0 };
      const nbJours    = days.length;
      const grandTotal = nbJours * tarifJour;
      return { type: 'tiers', nbJours, tarifJour, grandTotal };
    }

    return null;
  }, [fonction, categorie, dateDepart, dateArrivee, noHebergement, noRepas, loadingRules]);

  if (loadingRules) return null;
  if (!calculation) return null;

  const fmt = (m) => m.toLocaleString('fr-FR') + ' Ar';

  const rgLabels = {
    'RG1': { label: 'RG1 – Hébergement et repas pris en charge (feuille 1) : aucune indemnité d\'hébergement ni de repas', color: 'bg-red-100 text-red-700' },
    'RG2': { label: 'RG2 – Repas pris en charge (feuille 2) : aucune indemnité de repas, indemnité d\'hébergement maintenue', color: 'bg-amber-100 text-amber-700' },
    'RG3': { label: 'RG3 – Avec couchette : indemnité d\'hébergement déduite', color: 'bg-orange-100 text-orange-700' }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          Calcul des Indemnités
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">

        {/* Alertes RG appliquées */}
        {rgApplied.length > 0 && (
          <div className="space-y-2">
            {rgApplied.map(rg => (
              <div key={rg} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${rgLabels[rg].color}`}>
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{rgLabels[rg].label}</span>
              </div>
            ))}
          </div>
        )}

        {calculation.type === 'interne' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Petit-déj</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Déjeuner</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Dîner</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Hébergement</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculation.dailyData.map((day, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                    <TableCell className="font-medium text-slate-700">{day.date}</TableCell>
                    <TableCell className="text-right text-slate-600">{day.petit_dej > 0 ? fmt(day.petit_dej) : '-'}</TableCell>
                    <TableCell className="text-right text-slate-600">{day.dejeuner > 0 ? fmt(day.dejeuner) : '-'}</TableCell>
                    <TableCell className="text-right text-slate-600">{day.diner > 0 ? fmt(day.diner) : '-'}</TableCell>
                    <TableCell className="text-right text-slate-600">{day.hebergement > 0 ? fmt(day.hebergement) : '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">{fmt(day.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {(calculation.type === 'evenement' || calculation.type === 'tiers') && calculation.message && (
          <p className="text-amber-600 text-sm">{calculation.message}</p>
        )}

        {(calculation.type === 'evenement' || calculation.type === 'tiers') && !calculation.message && (
          <div className="space-y-2 text-slate-700">
            <p><span className="font-medium">Nombre de jours :</span> {calculation.nbJours}</p>
            <p><span className="font-medium">Indemnité par jour :</span> {fmt(calculation.tarifJour)}</p>
          </div>
        )}

        {showTotal && (
          <div className="mt-4 pt-4 border-t-2 border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-800 tracking-wide">TOTAL DES INDEMNITÉS</span>
              <span className="text-xl font-bold text-indigo-600">{fmt(calculation.grandTotal)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}