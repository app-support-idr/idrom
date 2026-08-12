import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Loader2, AlertCircle, Download, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function BeneficiaryFileList({ files, loading, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (fileId) => {
    setDeletingId(fileId);
    await base44.entities.EmployeeBeneficiary.delete(fileId);
    setDeletingId(null);
    onDelete?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-4 rounded-lg border border-amber-100">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        Aucun fichier uploadé. Tous les employés recevront leurs indemnités complètes.
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          Fichiers uploadés ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-slate-600 font-medium">Nom du fichier</th>
                <th className="text-left py-3 px-3 text-slate-600 font-medium">Uploadé par</th>
                <th className="text-left py-3 px-3 text-slate-600 font-medium">Date & Heure</th>
                <th className="text-center py-3 px-3 text-slate-600 font-medium">Héberg.+Repas</th>
                <th className="text-center py-3 px-3 text-slate-600 font-medium">Repas seul.</th>
                <th className="text-center py-3 px-3 text-slate-600 font-medium">Statut</th>
                <th className="text-center py-3 px-3 text-slate-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={file.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">
                        {file.file_name || 'Fichier importé'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{file.uploaded_by}</td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(file.created_date).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(file.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {(file.hebergement_repas || []).length}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      {(file.repas_seulement || []).length}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {index === 0 ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">Actif</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500 text-xs">Archivé</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        onClick={() => window.open(file.file_url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(file.id)}
                        disabled={deletingId === file.id}
                      >
                        {deletingId === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}