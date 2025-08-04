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
              <AlertCircle className="text-orange-400" size={16} />
              <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">Related Symptoms</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {organ.relatedSymptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-orange-900/30 text-orange-300 text-xs rounded-full border border-orange-700/50"
                >
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">System:</span>
              <div className="text-white font-medium capitalize">{organ.system}</div>
            </div>
            <div>
              <span className="text-slate-400">Location:</span>
              <div className="text-white font-medium">{organ.location}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganInfo;