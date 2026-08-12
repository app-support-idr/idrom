import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import moment from 'moment';

export default function MissionPrint() {
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const missionId = params.get('id');
    if (!missionId) {
      navigate('/');
      return;
    }
    base44.entities.MissionOrder.get(missionId)
      .then(setMission)
      .catch(() => setMission(null))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-600">Mission introuvable</p>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 8mm !important; }
          @page { size: A4; margin: 8mm; }
          body { background: white !important; }
        }
        .print-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          line-height: 1.3;
          font-size: 10px;
        }
        .pm-header {
          text-align: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #4f46e5;
        }
        .pm-header h1 { font-size: 18px; color: #4f46e5; margin-bottom: 4px; }
        .pm-header p { color: #64748b; font-size: 11px; }
        .pm-section { margin-bottom: 12px; }
        .pm-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #4f46e5;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .pm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pm-field { margin-bottom: 6px; }
        .pm-field-label { font-size: 9px; color: #64748b; margin-bottom: 1px; }
        .pm-field-value { font-size: 10px; font-weight: 500; }
        .pm-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 9px;
        }
        .pm-table th, .pm-table td {
          border: 1px solid #e2e8f0;
          padding: 4px 6px;
          text-align: left;
        }
        .pm-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .pm-table th:not(:first-child) { text-align: right; }
        .pm-table td:not(:first-child) { text-align: right; }
        .pm-total-row { background: #eef2ff; font-weight: bold; font-size: 10px; }
        .pm-total-row td { color: #4f46e5; }
        .pm-total-label { text-align: right; font-weight: 700; font-size: 11px; color: #1e293b; }
        .pm-total-amount { text-align: right; font-weight: 700; font-size: 12px; color: #4f46e5; }
        .pm-validation-item {
          padding: 6px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 6px;
          background: #fafafa;
          font-size: 9px;
        }
        .pm-validation-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .pm-validation-name { font-weight: 600; }
        .pm-validation-decision { font-weight: 600; }
        .pm-decision-valide { color: #16a34a; }
        .pm-decision-rejete { color: #dc2626; }
        .pm-decision-modification { color: #d97706; }
        .pm-footer {
          margin-top: 15px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #94a3b8;
          font-size: 8px;
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          <Button onClick={() => window.print()} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="print-page bg-white shadow-lg rounded-lg p-8" style={{ minHeight: '270mm' }}>
          <PrintContent mission={mission} />
        </div>
      </div>
    </div>
  );
}

function PrintContent({ mission }) {
  const getDecisionClass = (decision) => {
    if (decision === 'Validé') return 'pm-decision-valide';
    if (decision === 'Rejeté') return 'pm-decision-rejete';
    return 'pm-decision-modification';
  };

  return (
    <>
      <div className="pm-header">
        <h1>ORDRE DE MISSION</h1>
        <p>N° {mission.numero_om}</p>
      </div>

      <div className="pm-section">
        <div className="pm-section-title">Informations générales</div>
        <div className="pm-grid">
          <div className="pm-field">
            <div className="pm-field-label">Demandeur</div>
            <div className="pm-field-value">{mission.demandeur_name} ({mission.demandeur_profile})</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Statut</div>
            <div className="pm-field-value">{mission.status}</div>
          </div>
        </div>
      </div>

      <div className="pm-section">
        <div className="pm-section-title">Personne en mission</div>
        <div className="pm-grid">
          <div className="pm-field">
            <div className="pm-field-label">Nom et prénom</div>
            <div className="pm-field-value">{mission.nom_prenom}</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Matricule</div>
            <div className="pm-field-value">{mission.matricule}</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Fonction</div>
            <div className="pm-field-value">{mission.fonction}</div>
          </div>
        </div>
      </div>

      <div className="pm-section">
        <div className="pm-section-title">Détails de la mission</div>
        <div className="pm-grid">
          <div className="pm-field">
            <div className="pm-field-label">Destination</div>
            <div className="pm-field-value">{mission.lieu_destination}</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Catégorie</div>
            <div className="pm-field-value">{mission.categorie_mission}</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Date et heure de départ</div>
            <div className="pm-field-value">{moment(mission.date_heure_depart).format('DD/MM/YYYY HH:mm')}</div>
          </div>
          <div className="pm-field">
            <div className="pm-field-label">Date et heure d'arrivée</div>
            <div className="pm-field-value">{moment(mission.date_heure_arrivee).format('DD/MM/YYYY HH:mm')}</div>
          </div>
        </div>
        <div className="pm-field" style={{ marginTop: '15px' }}>
          <div className="pm-field-label">Motif de la mission</div>
          <div className="pm-field-value">{mission.motif_mission}</div>
        </div>
        {mission.condition_particuliere && (
          <div className="pm-field">
            <div className="pm-field-label">Condition particulière</div>
            <div className="pm-field-value">{mission.condition_particuliere}</div>
          </div>
        )}
        {mission.observation && (
          <div className="pm-field">
            <div className="pm-field-label">Observation</div>
            <div className="pm-field-value">{mission.observation}</div>
          </div>
        )}
        <div className="pm-field">
          <div className="pm-field-label">Régularisation</div>
          <div className="pm-field-value">{mission.regularisation}</div>
        </div>
      </div>

      {mission.a_refacturer && (
        <div className="pm-section">
          <div className="pm-section-title">Refacturation</div>
          <div className="pm-grid">
            <div className="pm-field">
              <div className="pm-field-label">A Refacturer</div>
              <div className="pm-field-value">Oui</div>
            </div>
            <div className="pm-field">
              <div className="pm-field-label">Client à refacturer</div>
              <div className="pm-field-value">{mission.client_refacturation}</div>
            </div>
            <div className="pm-field">
              <div className="pm-field-label">Statut refacturation</div>
              <div className="pm-field-value">{mission.statut_refacturation || 'A faire'}</div>
            </div>
            {mission.statut_refacturation === 'Annulé' && mission.refacturation_annulee_par && (
              <div className="pm-field">
                <div className="pm-field-label">Annulée par</div>
                <div className="pm-field-value">{mission.refacturation_annulee_par}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pm-section">
        <div className="pm-section-title">Moyen de transport</div>
        <div className="pm-grid">
          <div className="pm-field">
            <div className="pm-field-label">Moyen de transport</div>
            <div className="pm-field-value">{mission.moyen_transport}</div>
          </div>
          {mission.moyen_transport === 'Véhicule' && (
            <>
              <div className="pm-field">
                <div className="pm-field-label">Immatriculation</div>
                <div className="pm-field-value">{mission.immatriculation || '-'}</div>
              </div>
              <div className="pm-field">
                <div className="pm-field-label">Couchette</div>
                <div className="pm-field-value">{mission.avec_couchette ? 'Avec couchette' : 'Sans couchette'}</div>
              </div>
            </>
          )}
          {mission.moyen_transport === 'Autres' && mission.type_transport_autre && (
            <div className="pm-field">
              <div className="pm-field-label">Type de transport</div>
              <div className="pm-field-value">{mission.type_transport_autre}</div>
            </div>
          )}
        </div>
      </div>

      <div className="pm-section">
        <div className="pm-section-title">Tableau des indemnités</div>
        <IndemnityTablePrint
          fonction={mission.fonction}
          categorie={mission.categorie_mission}
          dateDepart={mission.date_heure_depart}
          dateArrivee={mission.date_heure_arrivee}
        />
      </div>

      {mission.validation_history && mission.validation_history.length > 0 && (
        <div className="pm-section">
          <div className="pm-section-title">Historique des validations</div>
          {mission.validation_history.map((validation, index) => (
            <div key={index} className="pm-validation-item">
              <div className="pm-validation-header">
                <span className="pm-validation-name">
                  {validation.validator_name} ({validation.validator_profile})
                </span>
                <span className={`pm-validation-decision ${getDecisionClass(validation.decision)}`}>
                  {validation.decision}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>
                {moment(validation.date).format('DD/MM/YYYY HH:mm')}
              </div>
              {validation.comment && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#475569' }}>
                  "{validation.comment}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pm-footer">
        Document généré le {moment().format('DD/MM/YYYY à HH:mm')}
      </div>
    </>
  );
}

function IndemnityTablePrint({ fonction, categorie, dateDepart, dateArrivee }) {
  const TARIFS_INTERNE = {
    'DG': { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
    'Directeur': { petit_dej: 15000, dejeuner: 25000, diner: 25000, hebergement: 130000 },
    'Responsable': { petit_dej: 10000, dejeuner: 20000, diner: 20000, hebergement: 80000 },
    'Agent spécialisé': { petit_dej: 5000, dejeuner: 10000, diner: 15000, hebergement: 45000 },
    'Agent': { petit_dej: 5000, dejeuner: 8000, diner: 7000, hebergement: 35000 }
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

  const formatMontant = (montant) => montant.toLocaleString('fr-FR') + ' Ar';

  if (!fonction || !categorie || !dateDepart || !dateArrivee) return null;

  const depart = new Date(dateDepart);
  const arrivee = new Date(dateArrivee);
  if (arrivee <= depart) return null;

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
    if (!tarifs) return <p>Aucune indemnité pour cette fonction</p>;

    const dailyData = days.map((day, index) => {
      const isFirstDay = index === 0;
      const isLastDay = index === days.length - 1;
      const dateStr = day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });

      let petit_dej = 0, dejeuner = 0, diner = 0, hebergement = 0;

      if (isFirstDay && isLastDay) {
        petit_dej = departHour < 5 ? tarifs.petit_dej : 0;
        dejeuner = (departHour < 12 && arriveeHour >= 12) ? tarifs.dejeuner : 0;
        diner = arriveeHour >= 19 ? tarifs.diner : 0;
        hebergement = 0;
      } else if (isFirstDay) {
        petit_dej = departHour < 5 ? tarifs.petit_dej : 0;
        dejeuner = departHour < 12 ? tarifs.dejeuner : 0;
        diner = departHour < 19 ? tarifs.diner : 0;
        hebergement = tarifs.hebergement;
      } else if (isLastDay) {
        petit_dej = arriveeHour >= 5 ? tarifs.petit_dej : 0;
        dejeuner = arriveeHour >= 12 ? tarifs.dejeuner : 0;
        diner = arriveeHour >= 19 ? tarifs.diner : 0;
        hebergement = 0;
      } else {
        petit_dej = tarifs.petit_dej;
        dejeuner = tarifs.dejeuner;
        diner = tarifs.diner;
        hebergement = tarifs.hebergement;
      }

      const total = petit_dej + dejeuner + diner + hebergement;
      return { date: dateStr, petit_dej, dejeuner, diner, hebergement, total };
    });

    const grandTotal = dailyData.reduce((sum, day) => sum + day.total, 0);

    return (
      <table className="pm-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Petit-déj</th>
            <th>Déjeuner</th>
            <th>Dîner</th>
            <th>Hébergement</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {dailyData.map((day, index) => (
            <tr key={index}>
              <td>{day.date}</td>
              <td>{day.petit_dej > 0 ? formatMontant(day.petit_dej) : '-'}</td>
              <td>{day.dejeuner > 0 ? formatMontant(day.dejeuner) : '-'}</td>
              <td>{day.diner > 0 ? formatMontant(day.diner) : '-'}</td>
              <td>{day.hebergement > 0 ? formatMontant(day.hebergement) : '-'}</td>
              <td>{formatMontant(day.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="pm-total-label">TOTAL DES INDEMNITÉS</td>
            <td className="pm-total-amount">{formatMontant(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    );
  } else {
    const tarifJour = categorie === 'Evenement(foire, salon)' ? TARIFS_EVENEMENT[fonction] : TARIFS_TIERS[fonction];
    if (!tarifJour) return <p>Aucune indemnité pour cette fonction dans cette catégorie</p>;

    const nbJours = days.length;
    const grandTotal = nbJours * tarifJour;

    return (
      <table className="pm-table">
        <thead>
          <tr>
            <th>Nombre de jours</th>
            <th>Indemnité par jour</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{nbJours}</td>
            <td>{formatMontant(tarifJour)}</td>
            <td className="pm-total-row">{formatMontant(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}