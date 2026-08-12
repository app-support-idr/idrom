import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PeriodFilter({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px] h-9 border-slate-200 bg-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">Ce mois</SelectItem>
        <SelectItem value="quarter">Ce trimestre</SelectItem>
        <SelectItem value="year">Cette année</SelectItem>
        <SelectItem value="all">Tout</SelectItem>
      </SelectContent>
    </Select>
  );
}