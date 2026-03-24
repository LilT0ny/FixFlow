import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../../../../components/atoms/Card';

interface CardEstadisticaProps {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
  colorIcono: string;
  fondoIcono: string;
}

export const CardEstadistica: React.FC<CardEstadisticaProps> = ({ titulo, valor, icono: Icono, colorIcono, fondoIcono }) => {
  return (
    <Card className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className={`p-3 rounded-xl ${fondoIcono}`}>
        <Icono className={`w-6 h-6 ${colorIcono}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-surface-500 uppercase tracking-wider">{titulo}</p>
        <h3 className="text-2xl font-bold text-surface-900">{valor}</h3>
      </div>
    </Card>
  );
};
