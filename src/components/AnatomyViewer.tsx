import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface AnatomyViewerProps {
  system: string;
}

const AnatomyViewer: React.FC<AnatomyViewerProps> = ({ system }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 1.2); // Zoom in

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5; // allow zoom in
    controls.maxDistance = 8;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const animate = () => {
      requestAnimationFrame(animate);

      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005; // smooth rotation
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setScene(scene);

    return () => {
      renderer.dispose();
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!scene) return;

    // Clear previous model
    if (modelRef.current) {
      scene.remove(modelRef.current);
    }

    const loader = new GLTFLoader();

    const systemModels: Record<string, string> = {
      skeletal: '/models/skeletal_model.glb',
      muscular: '/models/muscular_model.glb',
      nervous: '/models/nervous_model.glb',
    };

    const loadModel = (url: string) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(2, 2, 2); // Enlarge model

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center); // Center model

          scene.add(model);
          modelRef.current = model;
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    };

    const fallback = () => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(2, 2, 2);
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      mesh.position.sub(center);
      scene.add(mesh);
      modelRef.current = mesh;
    };

    if (systemModels[system]) {
      loadModel(systemModels[system]);
    } else {
      fallback();
    }
  }, [scene, system]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '500px', overflow: 'hidden' }}
    />
  );
};

export default AnatomyViewer;
