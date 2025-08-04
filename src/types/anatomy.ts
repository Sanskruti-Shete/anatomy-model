import * as THREE from 'three';

export interface OrganData {
  id: string;
  name: string;
  description: string;
  function: string;
  system: string;
  location: string;
  relatedSymptoms?: string[];
  color?: string;
}

export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  affectedOrgans: string[];
  category: string;
}

export interface CameraPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}