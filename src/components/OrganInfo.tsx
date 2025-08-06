import React from 'react';
import { X, Heart, AlertCircle, Info, Zap } from 'lucide-react';
import { OrganData } from '../types/anatomy';

interface OrganInfoProps {
  organ: OrganData;
  onClose: () => void;
}

const OrganInfo: React.FC<OrganInfoProps> = ({ organ, onClose }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50 mt-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Heart className="text-red-400" size={24} />
          <h3 className="text-xl font-bold text-white">{organ.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors duration-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="text-blue-400" size={16} />
            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Description</h4>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{organ.description}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={16} />
            <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">Function</h4>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{organ.function}</p>
        </div>

        {organ.relatedSymptoms && organ.relatedSymptoms.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-orange-500/20 rounded">
                <AlertCircle className="text-orange-400" size={16} />
              </div>
              <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Related Symptoms</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {organ.relatedSymptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-900/40 text-orange-200 text-xs rounded-full border border-orange-600/50 hover:bg-orange-800/50 transition-colors duration-200"
                >
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-600/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wide">System:</span>
              <div className="text-white font-semibold capitalize mt-1">{organ.system}</div>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wide">Location:</span>
              <div className="text-white font-semibold mt-1">{organ.location}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to get interesting facts about organs
const getOrganFact = (organName: string): string => {
  const facts: { [key: string]: string } = {
    'Heart': 'Your heart beats about 100,000 times per day, pumping roughly 2,000 gallons of blood through your body!',
    'Liver': 'The liver can regenerate itself! It can regrow to its full size even if up to 75% of it is removed.',
    'Lungs': 'If you could spread out your lungs flat, they would cover an area roughly the size of a tennis court.',
    'Brain': 'Your brain uses about 20% of your total energy, despite being only 2% of your body weight.',
    'Kidneys': 'Your kidneys filter about 50 gallons of blood every single day, removing waste and excess water.',
    'Stomach': 'Your stomach produces about 2-3 liters of gastric acid daily, which is strong enough to dissolve metal!',
    'Spine': 'Your spine has the same number of curves as a spring, giving it incredible strength and flexibility.'
  };
  
  return facts[organName] || 'This organ plays a crucial role in keeping your body healthy and functioning properly.';
};

export default OrganInfo;