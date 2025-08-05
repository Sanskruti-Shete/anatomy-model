import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface AnatomyViewerProps {
  system: string;
}

const AnatomyViewer: React.FC<AnatomyViewerProps> = ({ system }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.8); // 🔍 Zoomed in

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.2; // 🔍 Allow closer zoom
    controls.maxDistance = 5;

    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    const animate = () => {
      requestAnimationFrame(animate);
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005; // rotation speed
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
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
          model.scale.set(3, 3, 3); // 📏 Larger size

          // ✅ Center the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center); // shift to origin

          sceneRef.current!.add(model);
          modelRef.current = model;
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    };

    const addFallbackCube = () => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.scale.set(3, 3, 3); // same scale
      cube.position.set(0, 0, 0); // already centered
      sceneRef.current!.add(cube);
      modelRef.current = cube;
    };

    const modelPath = systemModels[system.toLowerCase()];
    if (modelPath) {
      loadModel(modelPath);
    } else {
      addFallbackCube();
    }
  }, [system]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '500px',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    />
  );
};

export default AnatomyViewer;
