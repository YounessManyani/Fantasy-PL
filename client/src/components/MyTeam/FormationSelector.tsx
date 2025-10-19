import { ChevronDown } from 'lucide-react';
import type { Formation } from '../../types/myteam.types';
import { FORMATIONS } from '../../types/myteam.types';
import React from 'react';

interface FormationSelectorProps {
  selectedFormation: Formation;
  onFormationChange: (formation: Formation) => void;
}

export const FormationSelector = ({ 
  selectedFormation, 
  onFormationChange 
}: FormationSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Formation</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 transition-colors"
        >
          <span className="text-gray-900 font-medium">{selectedFormation}</span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
              <button
                key={formation}
                onClick={() => {
                  onFormationChange(formation);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  formation === selectedFormation ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                }`}
              >
                {formation}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};