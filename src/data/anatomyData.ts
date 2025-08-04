import * as THREE from 'three';
import { OrganData, Symptom, CameraPreset } from '../types/anatomy';

export const organDatabase: OrganData[] = [
  {
    id: 'heart',
    name: 'Heart',
    description: 'A muscular organ that pumps blood throughout the body via the circulatory system.',
    function: 'Pumps oxygenated blood to tissues and returns deoxygenated blood to the lungs for oxygenation.',
    system: 'circulatory',
    location: 'Left side of the chest cavity',
    relatedSymptoms: ['Chest pain', 'Shortness of breath', 'Heart palpitations', 'Fatigue'],
    color: '#ff4444'
  },
  {
    id: 'liver',
    name: 'Liver',
    description: 'The largest internal organ that performs over 500 vital functions including detoxification.',
    function: 'Processes nutrients, filters toxins, produces bile, and stores vitamins and minerals.',
    system: 'digestive',
    location: 'Upper right abdomen',
    relatedSymptoms: ['Abdominal pain', 'Jaundice', 'Nausea', 'Loss of appetite'],
    color: '#8B4513'
  },
  {
    id: 'lungs',
    name: 'Lungs',
    description: 'Paired respiratory organs that facilitate gas exchange between air and blood.',
    function: 'Exchange oxygen and carbon dioxide between the air and bloodstream.',
    system: 'respiratory',
    location: 'Chest cavity on both sides of the heart',
    relatedSymptoms: ['Cough', 'Shortness of breath', 'Chest tightness', 'Wheezing'],
    color: '#ffaaaa'
  },
  {
    id: 'stomach',
    name: 'Stomach',
    description: 'A hollow organ that holds food and begins the digestion process using acid and enzymes.',
    function: 'Breaks down food using gastric acid and enzymes, and stores partially digested food.',
    system: 'digestive',
    location: 'Upper left abdomen',
    relatedSymptoms: ['Stomach pain', 'Nausea', 'Heartburn', 'Bloating'],
    color: '#ff6666'
  },
  {
    id: 'kidneys',
    name: 'Kidneys',
    description: 'Bean-shaped organs that filter waste and excess water from blood to produce urine.',
    function: 'Filter blood, produce urine, regulate blood pressure, and maintain electrolyte balance.',
    system: 'urinary',
    location: 'Lower back on both sides of the spine',
    relatedSymptoms: ['Back pain', 'Frequent urination', 'Blood in urine', 'Swelling'],
    color: '#660000'
  },
  {
    id: 'brain',
    name: 'Brain',
    description: 'The control center of the nervous system, responsible for thoughts, emotions, and bodily functions.',
    function: 'Controls all bodily functions, processes sensory information, and enables consciousness.',
    system: 'nervous',
    location: 'Inside the skull',
    relatedSymptoms: ['Headache', 'Dizziness', 'Memory problems', 'Seizures'],
    color: '#ffaacc'
  },
  {
    id: 'spine',
    name: 'Spine',
    description: 'The vertebral column that protects the spinal cord and provides structural support.',
    function: 'Protects spinal cord, provides structural support, and enables flexible movement.',
    system: 'skeletal',
    location: 'Center of the back from skull to pelvis',
    relatedSymptoms: ['Back pain', 'Stiffness', 'Numbness', 'Muscle weakness'],
    color: '#ffffff'
  }
];

export const symptomDatabase: Symptom[] = [
  {
    id: 'chest-pain',
    name: 'Chest Pain',
    description: 'Pain or discomfort in the chest area',
    severity: 'severe',
    affectedOrgans: ['Heart', 'Lungs'],
    category: 'cardiovascular'
  },
  {
    id: 'shortness-breath',
    name: 'Shortness of Breath',
    description: 'Difficulty breathing or feeling out of breath',
    severity: 'moderate',
    affectedOrgans: ['Heart', 'Lungs'],
    category: 'respiratory'
  },
  {
    id: 'abdominal-pain',
    name: 'Abdominal Pain',
    description: 'Pain in the stomach or belly area',
    severity: 'moderate',
    affectedOrgans: ['Stomach', 'Liver'],
    category: 'digestive'
  },
  {
    id: 'headache',
    name: 'Headache',
    description: 'Pain in the head or upper neck',
    severity: 'mild',
    affectedOrgans: ['Brain'],
    category: 'neurological'
  },
  {
    id: 'back-pain',
    name: 'Back Pain',
    description: 'Pain in the back, often in the lower back',
    severity: 'moderate',
    affectedOrgans: ['Spine', 'Kidneys'],
    category: 'musculoskeletal'
  },
  {
    id: 'nausea',
    name: 'Nausea',
    description: 'Feeling sick to your stomach',
    severity: 'mild',
    affectedOrgans: ['Stomach', 'Liver'],
    category: 'digestive'
  },
  {
    id: 'fatigue',
    name: 'Fatigue',
    description: 'Extreme tiredness or lack of energy',
    severity: 'mild',
    affectedOrgans: ['Heart', 'Liver'],
    category: 'general'
  },
  {
    id: 'dizziness',
    name: 'Dizziness',
    description: 'Feeling lightheaded or unsteady',
    severity: 'mild',
    affectedOrgans: ['Brain', 'Heart'],
    category: 'neurological'
  }
];

export const cameraPresets: CameraPreset[] = [
  {
    name: 'Front View',
    position: new THREE.Vector3(0, 0, 5),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    name: 'Back View',
    position: new THREE.Vector3(0, 0, -5),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    name: 'Side View',
    position: new THREE.Vector3(5, 0, 0),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    name: 'Top View',
    position: new THREE.Vector3(0, 5, 0),
    target: new THREE.Vector3(0, 0, 0)
  },
  {
    name: 'Head Focus',
    position: new THREE.Vector3(0, 2, 3),
    target: new THREE.Vector3(0, 1.2, 0)
  },
  {
    name: 'Torso Focus',
    position: new THREE.Vector3(0, 0, 3),
    target: new THREE.Vector3(0, 0.3, 0)
  }
];