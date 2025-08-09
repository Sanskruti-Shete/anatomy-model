import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface AnatomyViewerProps {
  onOrganClick: (organName: string) => void;
  selectedSystem: string;
  affectedOrgans: string[];
  painIntensity: number;
  selectedOrgan?: string;
}

interface AnatomyViewerRef {
  setCameraPosition: (position: THREE.Vector3, target: THREE.Vector3) => void;
  resetCamera: () => void;
}

const systemModels: { [key: string]: string } = {
  all: '/models/spanchnology/scene.gltf',
  skeletal: '/models/arthrology/scene.gltf',
  muscular: '/models/muscular_insertions/scene.gltf',
  circulatory: '/models/angiology/scene.gltf',
  respiratory: '/models/respiratory-system.gltf',
  nervous: '/models/neurology/scene.gltf',
  digestive: '/models/spanchnology/scene.gltf',
  urinary: '/models/urinary-system.gltf',
};

const AnatomyViewer = forwardRef<AnatomyViewerRef, AnatomyViewerProps>(
  ({ onOrganClick, selectedSystem, affectedOrgans, painIntensity, selectedOrgan }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sceneRef = useRef<THREE.Scene>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const controlsRef = useRef<OrbitControls>();
    const organsRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const modelRef = useRef<THREE.Group>();
    const currentSystemRef = useRef<string>('');

    useImperativeHandle(ref, () => ({
      setCameraPosition: (position: THREE.Vector3, target: THREE.Vector3) => {
        if (cameraRef.current && controlsRef.current) {
          const startPos = cameraRef.current.position.clone();
          const startTarget = controlsRef.current.target.clone();
          const duration = 1000;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            cameraRef.current!.position.lerpVectors(startPos, position, easeProgress);
            controlsRef.current!.target.lerpVectors(startTarget, target, easeProgress);
            controlsRef.current!.update();

            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      resetCamera: () => {
        if (cameraRef.current && controlsRef.current) {
          const defaultPos = new THREE.Vector3(0, 0, 2.2);
          const defaultTarget = new THREE.Vector3(0, 0, 0);
          const startPos = cameraRef.current.position.clone();
          const startTarget = controlsRef.current.target.clone();
          const duration = 800;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            cameraRef.current!.position.lerpVectors(startPos, defaultPos, easeProgress);
            controlsRef.current!.target.lerpVectors(startTarget, defaultTarget, easeProgress);
            controlsRef.current!.update();

            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      }
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 2.2);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      scene.add(new THREE.AmbientLight(0x404040, 0.6));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);
      scene.add(new THREE.HemisphereLight(0x87ceeb, 0x1e3a8a, 0.4));

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxDistance = 8;
      controls.minDistance = 1.0;
      controlsRef.current = controls;

      setIsLoading(true);
      loadSystemModel(selectedSystem, scene, organsRef.current, setIsLoading, modelRef);
      currentSystemRef.current = selectedSystem;

      const handleClick = (event: MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
          const clickedOrgan = intersects[0].object as THREE.Mesh;
          console.log('Clicked object:', clickedOrgan.name, clickedOrgan.userData);
          
          // Try to find organ name from various sources
          let organName = clickedOrgan.userData.name || clickedOrgan.name;
          
          // If no direct match, try to map common mesh names to organ names
          if (!organName || organName === '') {
            const meshName = clickedOrgan.name.toLowerCase();
            if (meshName.includes('heart')) organName = 'Heart';
            else if (meshName.includes('liver')) organName = 'Liver';
            else if (meshName.includes('lung')) organName = 'Lungs';
            else if (meshName.includes('stomach')) organName = 'Stomach';
            else if (meshName.includes('kidney')) organName = 'Kidneys';
            else if (meshName.includes('brain')) organName = 'Brain';
            else if (meshName.includes('spine') || meshName.includes('vertebra')) organName = 'Spine';
            else organName = clickedOrgan.name || 'Unknown Organ';
          }
          
          console.log('Detected organ name:', organName);
          onOrganClick(organName);
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      const animate = () => {
        requestAnimationFrame(animate);
        if (modelRef.current) {
          modelRef.current.rotation.y += 0.005;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('click', handleClick);
        containerRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
      };
    }, [onOrganClick]);

    useEffect(() => {
      if (currentSystemRef.current !== selectedSystem && sceneRef.current) {
        setIsLoading(true);
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current = undefined;
        }
        organsRef.current.clear();
        loadSystemModel(selectedSystem, sceneRef.current, organsRef.current, setIsLoading, modelRef);
        currentSystemRef.current = selectedSystem;
      }
    }, [selectedSystem]);

    useEffect(() => {
      if (!modelRef.current || organsRef.current.size === 0) return;

      // Reset all materials first
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          const mat = child.material as THREE.MeshPhongMaterial;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
      
      // Apply highlighting based on selection and symptoms
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          const mat = child.material as THREE.MeshPhongMaterial;
          const meshName = child.name || child.userData.name || '';
          
          // Check if this mesh corresponds to the selected organ
          const isSelected = selectedOrgan && (
            meshName === selectedOrgan ||
            meshName.toLowerCase().includes(selectedOrgan.toLowerCase()) ||
            selectedOrgan.toLowerCase().includes(meshName.toLowerCase())
          );
          
          // Check if this mesh is affected by symptoms
          const isAffected = affectedOrgans.some(organ => 
            meshName === organ ||
            meshName.toLowerCase().includes(organ.toLowerCase()) ||
            organ.toLowerCase().includes(meshName.toLowerCase())
          );

          if (isSelected) {
            mat.emissive.setHex(0x0066ff);
            mat.emissiveIntensity = 0.8;
            console.log('Highlighting selected organ:', meshName);
          } else if (isAffected) {
            const intensity = painIntensity / 10;
            mat.emissive.setHex(0xff0000);
            mat.emissiveIntensity = intensity * 0.5;
          }
        }
      });
    }, [affectedOrgans, painIntensity, selectedOrgan]);

    return (
      <div ref={containerRef} className="w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading 3D Model...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

function loadSystemModel(
  systemType: string,
  scene: THREE.Scene,
  organsMap: Map<string, THREE.Mesh>,
  setIsLoading?: (loading: boolean) => void,
  modelRef?: React.MutableRefObject<THREE.Group | undefined>
) {
  const modelPath = systemModels[systemType] || systemModels['all'];
  const loader = new GLTFLoader();

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.5, 1.5, 1.5);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const standardMat = child.material as THREE.MeshStandardMaterial;
          const phongMat = new THREE.MeshPhongMaterial({
            color: standardMat.color,
            emissive: 0x000000,
            shininess: 30,
          });

          child.material = phongMat;
          child.userData.originalMaterial = phongMat.clone();
          child.userData.layer = systemType;
          child.userData.name = child.name;

          organsMap.set(child.name, child as THREE.Mesh);
        }
      });

      scene.add(model);
      if (modelRef) modelRef.current = model;
      setIsLoading?.(false);
    },
    undefined,
    (error) => {
      console.warn(`GLTF model failed to load (likely Git LFS issue), creating fallback geometry for ${systemType}`);
      
      // Create fallback geometry when GLTF loading fails
      const fallbackModel = createFallbackGeometry(systemType);
      
      fallbackModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.userData.layer = systemType;
          child.userData.name = child.name;
          organsMap.set(child.name, child as THREE.Mesh);
        }
      });
      
      scene.add(fallbackModel);
      if (modelRef) modelRef.current = fallbackModel;
      setIsLoading?.(false);
    }
  );
}

function createFallbackGeometry(systemType: string): THREE.Group {
  const group = new THREE.Group();
  
  // Define system-specific organs and their positions
  const systemOrgans: { [key: string]: Array<{name: string, position: [number, number, number], color: number, geometry: THREE.BufferGeometry}> } = {
    skeletal: [
      { name: 'Skull', position: [0, 0.8, 0], color: 0xf0f0f0, geometry: new THREE.SphereGeometry(0.15, 16, 16) },
      { name: 'Spine', position: [0, 0, 0], color: 0xe0e0e0, geometry: new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8) },
      { name: 'Ribs', position: [0, 0.3, 0], color: 0xd0d0d0, geometry: new THREE.TorusGeometry(0.25, 0.02, 8, 16) },
      { name: 'Pelvis', position: [0, -0.4, 0], color: 0xc0c0c0, geometry: new THREE.RingGeometry(0.15, 0.25, 8) }
    ],
    circulatory: [
      { name: 'Heart', position: [-0.1, 0.2, 0], color: 0xff4444, geometry: new THREE.SphereGeometry(0.12, 16, 16) },
      { name: 'Aorta', position: [0, 0.3, 0], color: 0xff6666, geometry: new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8) },
      { name: 'Arteries', position: [0.2, 0, 0], color: 0xff8888, geometry: new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6) },
      { name: 'Veins', position: [-0.2, 0, 0], color: 0x4444ff, geometry: new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6) }
    ],
    nervous: [
      { name: 'Brain', position: [0, 0.7, 0], color: 0xffaaff, geometry: new THREE.SphereGeometry(0.18, 16, 16) },
      { name: 'Spinal Cord', position: [0, 0, 0], color: 0xffccff, geometry: new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8) },
      { name: 'Nerves', position: [0.15, 0.2, 0], color: 0xffddff, geometry: new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6) }
    ],
    digestive: [
      { name: 'Stomach', position: [-0.15, 0.1, 0], color: 0xffaa44, geometry: new THREE.SphereGeometry(0.1, 16, 16) },
      { name: 'Liver', position: [0.2, 0.2, 0], color: 0x8B4513, geometry: new THREE.BoxGeometry(0.25, 0.15, 0.1) },
      { name: 'Intestines', position: [0, -0.2, 0], color: 0xffcc66, geometry: new THREE.TorusGeometry(0.15, 0.05, 8, 16) },
      { name: 'Kidneys', position: [0.25, -0.1, -0.1], color: 0x654321, geometry: new THREE.SphereGeometry(0.08, 12, 12) }
    ],
    muscular: [
      { name: 'Biceps', position: [0.3, 0.3, 0], color: 0xff6666, geometry: new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8) },
      { name: 'Chest Muscles', position: [0, 0.3, 0.1], color: 0xff4444, geometry: new THREE.BoxGeometry(0.3, 0.15, 0.08) },
      { name: 'Abdominals', position: [0, 0, 0.1], color: 0xff5555, geometry: new THREE.BoxGeometry(0.25, 0.3, 0.06) },
      { name: 'Quadriceps', position: [0.15, -0.4, 0], color: 0xff3333, geometry: new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8) }
    ]
  };
  
  // Default to digestive system if system not found
  const organs = systemOrgans[systemType] || systemOrgans['digestive'];
  
  organs.forEach(organ => {
    const material = new THREE.MeshPhongMaterial({ 
      color: organ.color,
      emissive: 0x000000,
      shininess: 30
    });
    
    const mesh = new THREE.Mesh(organ.geometry, material);
    mesh.position.set(...organ.position);
    mesh.name = organ.name;
    mesh.userData.name = organ.name;
    mesh.userData.originalMaterial = material.clone();
    
    group.add(mesh);
  });
  
  return group;
}

AnatomyViewer.displayName = 'AnatomyViewer';
export default AnatomyViewer;
