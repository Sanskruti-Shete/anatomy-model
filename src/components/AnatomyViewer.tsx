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
      loadAnatomyModel(scene, organsRef.current);

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

    // Update organ visibility based on selected system
    useEffect(() => {
      organsRef.current.forEach((organ, name) => {
        const layer = organ.userData.layer;
        if (selectedSystem === 'all') {
          organ.visible = true;
        } else {
          organ.visible = layer === selectedSystem;
        }
      });
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

function loadAnatomyModel(scene: THREE.Scene, organsMap: Map<string, THREE.Mesh>) {
  const loader = new GLTFLoader();
  
  loader.load(
    '/models/scene.gltf',
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
          
          // Determine organ system based on mesh name
          const organSystem = determineOrganSystem(child.name);
          child.userData.layer = organSystem;
          child.userData.name = child.name;
          
          // Add to organs map for interaction
          organsMap.set(child.name, child as THREE.Mesh);
          
          console.log(`Loaded organ: ${child.name} (${organSystem})`);
        }
      });
      
      scene.add(model);
      console.log('GLTF model loaded successfully');
    },
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading GLTF model:', error);
      
      // Fallback: create sample anatomy if model fails to load
      console.log('Creating fallback sample anatomy...');
      createFallbackAnatomy(scene, organsMap);
    }
  );
}

function determineOrganSystem(meshName: string): string {
  const name = meshName.toLowerCase();
  
  // Map mesh names to organ systems
  if (name.includes('heart') || name.includes('blood') || name.includes('vessel') || name.includes('artery') || name.includes('vein')) {
    return 'circulatory';
  } else if (name.includes('lung') || name.includes('trachea') || name.includes('bronch')) {
    return 'respiratory';
  } else if (name.includes('brain') || name.includes('nerve') || name.includes('spinal')) {
    return 'nervous';
  } else if (name.includes('stomach') || name.includes('liver') || name.includes('intestine') || name.includes('pancreas')) {
    return 'digestive';
  } else if (name.includes('kidney') || name.includes('bladder') || name.includes('ureter')) {
    return 'urinary';
  } else if (name.includes('bone') || name.includes('skull') || name.includes('rib') || name.includes('spine') || name.includes('vertebra')) {
    return 'skeletal';
  } else if (name.includes('muscle')) {
    return 'muscular';
  } else {
    return 'other';
  }
}

function createFallbackAnatomy(scene: THREE.Scene, organsMap: Map<string, THREE.Mesh>) {
  const organs = [
    { name: 'Heart', position: [-0.3, 0.5, 0], color: 0xff4444, layer: 'circulatory', size: 0.3 },
    { name: 'Liver', position: [0.3, 0.2, 0], color: 0x8B4513, layer: 'digestive', size: 0.4 },
    { name: 'Lungs', position: [0, 0.7, 0], color: 0xffaaaa, layer: 'respiratory', size: 0.35 },
    { name: 'Stomach', position: [-0.2, 0, 0], color: 0xff6666, layer: 'digestive', size: 0.25 },
    { name: 'Kidneys', position: [0.4, -0.2, -0.3], color: 0x660000, layer: 'urinary', size: 0.2 },
    { name: 'Brain', position: [0, 1.2, 0], color: 0xffaacc, layer: 'nervous', size: 0.3 },
    { name: 'Spine', position: [0, 0, -0.2], color: 0xffffff, layer: 'skeletal', size: [0.1, 1.5, 0.1] },
  ];

  organs.forEach(organData => {
    let geometry: THREE.BufferGeometry;
    
    if (organData.name === 'Spine') {
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
      layer: organData.layer,
    };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
    organsMap.set(organData.name, mesh);
  });
}

AnatomyViewer.displayName = 'AnatomyViewer';

export default AnatomyViewer;