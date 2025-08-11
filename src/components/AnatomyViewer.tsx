import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface AnatomyViewerProps {
  onOrganClick: (organName: string) => void;
  selectedSystem: string;
  affectedOrgans: string[];
  painIntensity: number;
  selectedOrgan?: string;
}

interface AnatomyViewerRef {
  setCameraPosition: (
    position: THREE.Vector3,
    target: THREE.Vector3
  ) => void;
  resetCamera: () => void;
}

const systemModels: { [key: string]: string } = {
  all: '/models/spanchnology/scene.gltf',
  skeletal: '/models/arthrology/scene.gltf',
  muscular: '/models/myology/scene.gltf',
  circulatory: '/models/angiology/scene.gltf',
  respiratory: '/models/respiratory-system.gltf',
  nervous: '/models/neurology/scene.gltf',
  digestive: '/models/angiology/new.gltf',
  urinary: '/models/urinary-system.gltf',
};

const AnatomyViewer = forwardRef<AnatomyViewerRef, AnatomyViewerProps>(
  (
    {
      onOrganClick,
      selectedSystem,
      affectedOrgans,
      painIntensity,
      selectedOrgan,
    },
    ref
  ) => {
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
    const isUserInteractingRef = useRef<boolean>(false);
    const rotationSpeed = 0.005; // radians per frame

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

            cameraRef.current!.position.lerpVectors(
              startPos,
              position,
              easeProgress
            );
            controlsRef.current!.target.lerpVectors(
              startTarget,
              target,
              easeProgress
            );
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

            cameraRef.current!.position.lerpVectors(
              startPos,
              defaultPos,
              easeProgress
            );
            controlsRef.current!.target.lerpVectors(
              startTarget,
              defaultTarget,
              easeProgress
            );
            controlsRef.current!.update();

            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
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

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
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

      // Pause auto-rotation while the user is interacting
      const onStart = () => (isUserInteractingRef.current = true);
      const onEnd = () => (isUserInteractingRef.current = false);
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onEnd);

      setIsLoading(true);
      loadSystemModel(
        selectedSystem,
        scene,
        organsRef.current,
        setIsLoading,
        modelRef
      );
      currentSystemRef.current = selectedSystem;

      const handleClick = (event: MouseEvent) => {
        const rect = containerRef.current!.getBoundingClientRect();
        mouseRef.current.x =
          ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(
          scene.children,
          true
        );

        if (intersects.length > 0) {
          const clicked = intersects[0].object as THREE.Object3D;
          let organName = clicked.name;

          // walk up parents to find meaningful name (if the mesh itself is generic)
          let parent = clicked.parent;
          while (parent && parent.name && parent.name !== 'Scene') {
            organName = parent.name;
            parent = parent.parent;
          }

          console.log('Detected organ:', organName);
          onOrganClick(organName);
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      const animate = () => {
        requestAnimationFrame(animate);

        // Auto-rotate the model when present and the user is not interacting
        if (modelRef.current && !isUserInteractingRef.current) {
          modelRef.current.rotation.y += rotationSpeed;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect =
          containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('click', handleClick);

        // cleanup controls listeners and dispose
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', onEnd);
        controls.dispose();

        containerRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
      };
    }, [onOrganClick]);

    useEffect(() => {
      if (
        currentSystemRef.current !== selectedSystem &&
        sceneRef.current
      ) {
        setIsLoading(true);
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current = undefined;
        }
        organsRef.current.clear();
        loadSystemModel(
          selectedSystem,
          sceneRef.current,
          organsRef.current,
          setIsLoading,
          modelRef
        );
        currentSystemRef.current = selectedSystem;
      }
    }, [selectedSystem]);

    useEffect(() => {
      if (!modelRef.current || organsRef.current.size === 0) return;

      modelRef.current.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh)
            .material as THREE.MeshPhongMaterial;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });

      const selectedLower = selectedOrgan?.toLowerCase() || '';
      const affectedLower = affectedOrgans.map((o) => o.toLowerCase());

      modelRef.current.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const meshLower = (child.name || '').toLowerCase();
          const mat = (child as THREE.Mesh)
            .material as THREE.MeshPhongMaterial;

          const isSelected =
            selectedLower && meshLower.includes(selectedLower);
          const isAffected = affectedLower.some((o) =>
            meshLower.includes(o)
          );

          if (isSelected) {
            mat.emissive.setHex(0x0066ff);
            mat.emissiveIntensity = 0.8;
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
    (gltf: GLTF) => {
      const model = gltf.scene;
      model.scale.set(1.5, 1.5, 1.5);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      model.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const standardMat = mesh.material as THREE.MeshStandardMaterial;
          const phongMat = new THREE.MeshPhongMaterial({
            color: standardMat.color,
            emissive: 0x000000,
            shininess: 30,
          });

          mesh.material = phongMat;
          mesh.userData.originalMaterial = phongMat.clone();
          mesh.userData.layer = systemType;
          mesh.userData.name = mesh.name;

          organsMap.set(mesh.name, mesh);
        }
      });

      scene.add(model);
      if (modelRef) modelRef.current = model;
      setIsLoading?.(false);
    },
    undefined,
    (error: unknown) => {
      console.error(`Error loading ${systemType} model:`, error);
      setIsLoading?.(false);
    }
  );
}

AnatomyViewer.displayName = 'AnatomyViewer';
export default AnatomyViewer;
