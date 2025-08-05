import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, Brain, Zap, Eye, Target, RotateCcw, Info, Settings, Activity } from 'lucide-react';
import AnatomyViewer from './components/AnatomyViewer';
import ControlPanel from './components/ControlPanel';
import OrganInfo from './components/OrganInfo';
import { OrganData, Symptom, CameraPreset } from './types/anatomy';
import { organDatabase, symptomDatabase, cameraPresets } from './data/anatomyData';

function App() {
  const [selectedOrgan, setSelectedOrgan] = useState<OrganData | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [painIntensity, setPainIntensity] = useState<number>(0);
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<string>('default');
  const anatomyViewerRef = useRef<any>(null);

  const handleOrganClick = (organName: string) => {
    const organ = organDatabase.find(o => o.name === organName);
    if (organ) {
      setSelectedOrgan(organ);
    }
  };

  const handleSymptomToggle = (symptomId: string) => {
    setActiveSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSystemSelect = (system: string) => {
    setSelectedSystem(system);
  };

  const handleCameraPreset = (preset: CameraPreset) => {
    setCurrentView(preset.name);
    if (anatomyViewerRef.current) {
      anatomyViewerRef.current.setCameraPosition(preset.position, preset.target);
    }
  };

  const filteredOrgans = organDatabase.filter(organ =>
    organ.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    organ.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const affectedOrgans = activeSymptoms.flatMap(symptomId => {
    const symptom = symptomDatabase.find(s => s.id === symptomId);
    return symptom ? symptom.affectedOrgans : [];
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="flex h-screen">
        {/* Left Panel - Controls */}
        <div className="w-1/2 overflow-y-auto bg-slate-900/50 backdrop-blur-sm border-r border-slate-700/50">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Heart className="text-red-500" size={32} />
                Anatomy Explorer
              </h1>
              <p className="text-slate-300">Interactive 3D Human Anatomy Model</p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search organs or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <ControlPanel
              selectedSystem={selectedSystem}
              onSystemSelect={handleSystemSelect}
              painIntensity={painIntensity}
              onPainIntensityChange={setPainIntensity}
              activeSymptoms={activeSymptoms}
              onSymptomToggle={handleSymptomToggle}
              symptoms={symptomDatabase}
              onCameraPreset={handleCameraPreset}
              currentView={currentView}
              cameraPresets={cameraPresets}
            />

            {/* Organ Information */}
            {selectedOrgan && (
              <OrganInfo 
                organ={selectedOrgan} 
                onClose={() => setSelectedOrgan(null)}
              />
            )}

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-green-400" size={20} />
                  <span className="text-sm text-slate-300">Active Symptoms</span>
                </div>
                <div className="text-2xl font-bold text-white">{activeSymptoms.length}</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-blue-400" size={20} />
                  <span className="text-sm text-slate-300">Pain Level</span>
                </div>
                <div className="text-2xl font-bold text-white">{painIntensity}/10</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - 3D Model */}
        <div className="w-1/2 relative">
          <AnatomyViewer
            ref={anatomyViewerRef}
            onOrganClick={handleOrganClick}
            selectedSystem={selectedSystem}
            affectedOrgans={affectedOrgans}
            painIntensity={painIntensity}
            selectedOrgan={selectedOrgan?.name}
          />
          
          {/* View Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => anatomyViewerRef.current?.resetCamera()}
              className="p-3 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-lg"
              title="Reset View"
            >
              <RotateCcw size={20} />
            </button>
            <button className="p-3 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-lg">
              <Settings size={20} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;