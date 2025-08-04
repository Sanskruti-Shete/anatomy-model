import React from 'react';
import { Eye, EyeOff, Zap, Camera, Layers, Activity } from 'lucide-react';
import { Symptom, CameraPreset } from '../types/anatomy';

interface ControlPanelProps {
  visibleLayers: string[];
  onLayerToggle: (layer: string) => void;
  painIntensity: number;
  onPainIntensityChange: (intensity: number) => void;
  activeSymptoms: string[];
  onSymptomToggle: (symptomId: string) => void;
  symptoms: Symptom[];
  onCameraPreset: (preset: CameraPreset) => void;
  currentView: string;
  cameraPresets: CameraPreset[];
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  visibleLayers,
  onLayerToggle,
  painIntensity,
  onPainIntensityChange,
  activeSymptoms,
  onSymptomToggle,
  symptoms,
  onCameraPreset,
  currentView,
  cameraPresets,
}) => {
  const layers = [
    { id: 'skeletal', name: 'Skeletal System', color: 'bg-gray-500' },
    { id: 'muscular', name: 'Muscular System', color: 'bg-red-500' },
    { id: 'circulatory', name: 'Circulatory System', color: 'bg-red-600' },
    { id: 'respiratory', name: 'Respiratory System', color: 'bg-blue-500' },
    { id: 'nervous', name: 'Nervous System', color: 'bg-yellow-500' },
    { id: 'digestive', name: 'Digestive System', color: 'bg-green-500' },
    { id: 'urinary', name: 'Urinary System', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Layer Controls */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="text-blue-400" size={20} />
          Organ Systems
        </h3>
        <div className="space-y-2">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${layer.color}`}></div>
                <span className="text-sm text-slate-300">{layer.name}</span>
              </div>
              <button
                onClick={() => onLayerToggle(layer.id)}
                className={`p-1 rounded transition-colors duration-200 ${
                  visibleLayers.includes(layer.id)
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {visibleLayers.includes(layer.id) ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Camera Presets */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Camera className="text-green-400" size={20} />
          Camera Views
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {cameraPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => onCameraPreset(preset)}
              className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                currentView === preset.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Pain Intensity */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="text-orange-400" size={20} />
          Pain Intensity
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-300">
            <span>No Pain</span>
            <span>Severe</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={painIntensity}
            onChange={(e) => onPainIntensityChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-center">
            <span className={`text-lg font-bold ${
              painIntensity === 0 ? 'text-green-400' :
              painIntensity <= 3 ? 'text-yellow-400' :
              painIntensity <= 6 ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {painIntensity}/10
            </span>
          </div>
        </div>
      </div>

      {/* Symptoms */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="text-purple-400" size={20} />
          Symptoms
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {symptoms.map(symptom => (
            <div key={symptom.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  symptom.severity === 'mild' ? 'bg-yellow-400' :
                  symptom.severity === 'moderate' ? 'bg-orange-400' :
                  'bg-red-400'
                }`}></div>
                <span className="text-sm text-slate-300">{symptom.name}</span>
              </div>
              <button
                onClick={() => onSymptomToggle(symptom.id)}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                  activeSymptoms.includes(symptom.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                }`}
              >
                {activeSymptoms.includes(symptom.id) ? 'Active' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;