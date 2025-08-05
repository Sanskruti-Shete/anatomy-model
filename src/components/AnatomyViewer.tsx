import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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

// Model paths for different organ systems
const systemModels: { [key: string]: string } = {
  'all': '/models/complete-anatomy.gltf',
  'skeletal': '/models/skeletal-system.gltf',
  'muscular': '/models/muscular-system.gltf',
  'circulatory': '/models/circulatory-system.gltf',
  'respiratory': '/models/respiratory-system.gltf',
  'nervous': '/models/nervous-system.gltf',
  'digestive': '/models/digestive-system.gltf',
  'urinary': '/models/urinary-system.gltf',
};

const AnatomyViewer = forwardRef<AnatomyViewerRef, AnatomyViewerProps>(
  ({ onOrganClick, selectedSystem, affectedOrgans, painIntensity, selectedOrgan }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene>();
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const controlsRef = useRef<OrbitControls>();
    const organsRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const modelRef = useRef<THREE.Group>();
    const loaderRef = useRef<GLTFLoader>(new GLTFLoader());
    const currentSystemRef = useRef<string>('');

    useImperativeHandle(ref, () => ({
      setCameraPosition: (position: THREE.Vector3, target: THREE.Vector3) => {
        if (cameraRef.current && controlsRef.current) {
          // Smooth camera transition
          const startPos = cameraRef.current.position.clone();
          const startTarget = controlsRef.current.target.clone();
          const duration = 1000; // 1 second
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            cameraRef.current!.position.lerpVectors(startPos, position, easeProgress);
            controlsRef.current!.target.lerpVectors(startTarget, target, easeProgress);
            controlsRef.current!.update();

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
      },
      resetCamera: () => {
        if (cameraRef.current && controlsRef.current) {
          const defaultPos = new THREE.Vector3(0, 0, 5);
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

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
      }
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Enhanced lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1e3a8a, 0.4);
      scene.add(hemisphereLight);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxDistance = 10;
      controls.minDistance = 1;
      controlsRef.current = controls;

      // Load GLTF model
      loadSystemModel(selectedSystem, scene, organsRef.current);
      currentSystemRef.current = selectedSystem;

      // Mouse click handler
      const handleClick = (event: MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(Array.from(organsRef.current.values()));

        if (intersects.length > 0) {
          const clickedOrgan = intersects[0].object as THREE.Mesh;
          onOrganClick(clickedOrgan.userData.name);
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
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

    // Load new model when system changes
    useEffect(() => {
      if (currentSystemRef.current !== selectedSystem && sceneRef.current) {
        // Clear current model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current = undefined;
        }
        
        // Clear organs map
        organsRef.current.clear();
        
        // Load new system model
        loadSystemModel(selectedSystem, sceneRef.current, organsRef.current);
        currentSystemRef.current = selectedSystem;
      }
    }, [selectedSystem]);

    // Update affected organs highlighting
    useEffect(() => {
      organsRef.current.forEach((organ, name) => {
        const isAffected = affectedOrgans.includes(name);
        const isSelected = selectedOrgan === name;
        
        if (isSelected) {
          (organ.material as THREE.MeshPhongMaterial).emissive.setHex(0x0066ff);
          (organ.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3;
        } else if (isAffected) {
          const intensity = painIntensity / 10;
          (organ.material as THREE.MeshPhongMaterial).emissive.setHex(0xff0000);
          (organ.material as THREE.MeshPhongMaterial).emissiveIntensity = intensity * 0.5;
        } else {
          (organ.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
          (organ.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
        }
      });
    }, [affectedOrgans, painIntensity, selectedOrgan]);

    return <div ref={containerRef} className="w-full h-full" />;
  }
);

function loadSystemModel(systemType: string, scene: THREE.Scene, organsMap: Map<string, THREE.Mesh>) {
  const modelPath = systemModels[systemType] || systemModels['all'];
  const loader = new GLTFLoader();
  
  console.log(`Loading model for ${systemType} system: ${modelPath}`);
  
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      
      // Scale and position the model appropriately
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Store original material properties
          if (child.material) {
            child.userData.originalMaterial = child.material.clone();
          }
          
          // Set the system type for this model
          child.userData.layer = systemType;
          child.userData.name = child.name;
          
          // Add to organs map for interaction
          organsMap.set(child.name, child as THREE.Mesh);
          
          console.log(`Loaded organ: ${child.name} (${systemType})`);
        }
      });
      
      scene.add(model);
      console.log(`${systemType} system model loaded successfully`);
    },
    (progress) => {
      console.log(`${systemType} loading progress:`, (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error(`Error loading ${systemType} model:`, error);
      
      // Fallback: create sample anatomy for this system if model fails to load
      console.log(`Creating fallback anatomy for ${systemType} system...`);
      createFallbackAnatomy(systemType, scene, organsMap);
    }
  );
}

function createFallbackAnatomy(systemType: string, scene: THREE.Scene, organsMap: Map<string, THREE.Mesh>) {
  // Define organs for each system
  const systemOrgans: { [key: string]: any[] } = {
    'all': [
      { name: 'Heart', position: [-0.3, 0.5, 0], color: 0xff4444, size: 0.3 },
      { name: 'Liver', position: [0.3, 0.2, 0], color: 0x8B4513, size: 0.4 },
      { name: 'Lungs', position: [0, 0.7, 0], color: 0xffaaaa, size: 0.35 },
      { name: 'Stomach', position: [-0.2, 0, 0], color: 0xff6666, size: 0.25 },
      { name: 'Kidneys', position: [0.4, -0.2, -0.3], color: 0x660000, size: 0.2 },
      { name: 'Brain', position: [0, 1.2, 0], color: 0xffaacc, size: 0.3 },
      { name: 'Spine', position: [0, 0, -0.2], color: 0xffffff, size: [0.1, 1.5, 0.1] },
    ],
    'circulatory': [
      { name: 'Heart', position: [0, 0.5, 0], color: 0xff4444, size: 0.4 },
      { name: 'Aorta', position: [0, 0.8, 0], color: 0xff6666, size: [0.1, 0.6, 0.1] },
      { name: 'Vena Cava', position: [0.2, 0.5, 0], color: 0x4444ff, size: [0.08, 0.5, 0.08] },
    ],
    'respiratory': [
      { name: 'Lungs', position: [0, 0.5, 0], color: 0xffaaaa, size: 0.4 },
      { name: 'Trachea', position: [0, 0.8, 0], color: 0xcccccc, size: [0.05, 0.3, 0.05] },
      { name: 'Bronchi', position: [0, 0.3, 0], color: 0xdddddd, size: 0.15 },
    ],
    'digestive': [
      { name: 'Stomach', position: [0, 0.3, 0], color: 0xff6666, size: 0.3 },
      { name: 'Liver', position: [0.4, 0.2, 0], color: 0x8B4513, size: 0.35 },
      { name: 'Small Intestine', position: [0, -0.2, 0], color: 0xffaa66, size: 0.25 },
      { name: 'Large Intestine', position: [0, -0.5, 0], color: 0xff8844, size: 0.3 },
    ],
    'nervous': [
      { name: 'Brain', position: [0, 1.0, 0], color: 0xffaacc, size: 0.35 },
      { name: 'Spinal Cord', position: [0, 0, 0], color: 0xffccdd, size: [0.05, 1.2, 0.05] },
      { name: 'Nerves', position: [0.3, 0.5, 0], color: 0xffffaa, size: 0.1 },
    ],
    'urinary': [
      { name: 'Kidneys', position: [0, 0.2, -0.2], color: 0x660000, size: 0.25 },
      { name: 'Bladder', position: [0, -0.3, 0], color: 0x884400, size: 0.2 },
      { name: 'Ureters', position: [0, -0.1, -0.1], color: 0x996600, size: [0.02, 0.4, 0.02] },
    ],
    'skeletal': [
      { name: 'Skull', position: [0, 1.2, 0], color: 0xffffff, size: 0.3 },
      { name: 'Spine', position: [0, 0, -0.2], color: 0xeeeeee, size: [0.08, 1.5, 0.08] },
      { name: 'Ribs', position: [0, 0.5, 0], color: 0xdddddd, size: [0.6, 0.4, 0.3] },
      { name: 'Pelvis', position: [0, -0.5, 0], color: 0xcccccc, size: [0.4, 0.2, 0.3] },
    ],
    'muscular': [
      { name: 'Chest Muscles', position: [0, 0.5, 0.1], color: 0xff6666, size: [0.5, 0.3, 0.2] },
      { name: 'Arm Muscles', position: [0.4, 0.3, 0], color: 0xff4444, size: 0.2 },
      { name: 'Leg Muscles', position: [0, -0.5, 0], color: 0xff2222, size: [0.3, 0.6, 0.2] },
    ],
  };

  const organs = systemOrgans[systemType] || systemOrgans['all'];

  organs.forEach(organData => {
    let geometry: THREE.BufferGeometry;
    
    if (Array.isArray(organData.size)) {
      geometry = new THREE.BoxGeometry(
        organData.size[0], 
        organData.size[1], 
        organData.size[2]
      );
    } else {
      geometry = new THREE.SphereGeometry(organData.size, 16, 16);
    }

    const material = new THREE.MeshPhongMaterial({
      color: organData.color,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...organData.position);
    mesh.userData = {
      name: organData.name,
      layer: systemType,
    };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
    organsMap.set(organData.name, mesh);
  });
}

AnatomyViewer.displayName = 'AnatomyViewer';

export default AnatomyViewer;