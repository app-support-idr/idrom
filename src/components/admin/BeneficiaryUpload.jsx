import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Extrait toutes les valeurs de la colonne "MAT" d'une feuille, en conservant les zéros initiaux
function extractMatriculesFromSheet(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  if (!rows.length) return [];

  // Trouver l'index de la colonne "MAT" dans l'en-tête, sinon colonne 0
  const header = rows[0];
  let matIndex = header.findIndex(h => String(h).trim().toUpperCase() === 'MAT');
  if (matIndex === -1) matIndex = 0;

  const matricules = [];
  for (let i = 1; i < rows.length; i++) {
    const val = rows[i][matIndex];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      matricules.push(String(val).trim());
    }
  }
  return matricules;
}

export default function BeneficiaryUpload({ currentUser, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Parser le fichier Excel côté client (extraction fiable de toutes les lignes)
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length < 2) {
        throw new Error("Le fichier doit contenir au moins 2 feuilles (feuille 1 : hébergement+repas, feuille 2 : repas seul).");
      }

      const hebergement_repas = extractMatriculesFromSheet(workbook.Sheets[sheetNames[0]]);
      const repas_seulement   = extractMatriculesFromSheet(workbook.Sheets[sheetNames[1]]);

      // 2. Uploader le fichier pour archivage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.EmployeeBeneficiary.create({
        uploaded_by: currentUser.user_email,
        file_url,
        file_name: file.name,
        hebergement_repas,
        repas_seulement
      });

      toast.success(`Fichier importé : ${hebergement_repas.length} bénéficiaires hébergement+repas, ${repas_seulement.length} bénéficiaires repas`);
      onUploaded?.();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import : " + (err.message || 'Erreur inconnue'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          Importer un fichier de bénéficiaires
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="font-medium text-blue-800 mb-2">Format attendu du fichier Excel :</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Feuille 1</strong> : Bénéficiaires d'indemnités hébergement + repas — colonne <strong>MAT</strong></li>
            <li><strong>Feuille 2</strong> : Bénéficiaires d'indemnités de repas uniquement — colonne <strong>MAT</strong></li>
          </ul>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="beneficiary-upload"
            disabled={uploading}
          />
          <label htmlFor="beneficiary-upload" className="cursor-pointer flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium text-slate-600">Traitement en cours, veuillez patienter...</span>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Cliquez pour uploader un fichier Excel (.xlsx)</span>
              </>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
}