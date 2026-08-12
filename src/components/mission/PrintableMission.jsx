import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';

export default function PrintableMission({ mission }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 mb-6">
      <Button
        onClick={() => navigate(`/MissionPrint?id=${mission.id}`)}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        <Printer className="w-4 h-4 mr-2" />
        Imprimer / Aperçu
      </Button>
    </div>
  );
}