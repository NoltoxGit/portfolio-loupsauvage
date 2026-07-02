import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { resolveMediaPath } from "./media";

const watermarkUrl = "https://api.skins.minestrator.com/avatar/LoupSauvage?size=512";
const MODEL_FRAME_PADDING = 1.15;
const PREVIEW_CAPTURE_WIDTH = 2048;
const PREVIEW_CAPTURE_HEIGHT = 1280;

export interface ModelViewerProps {
  src: string;
  title: string;
  interactive?: boolean;
  className?: string;
  watermark?: boolean;
  yawDegrees?: number;
  onPreviewGenerated?: (imageData: string) => void;
  previewOnceKey?: string | number;
}

export function ModelViewer({
  src,
  title,
  interactive = false,
  className = "",
  watermark = true,
  yawDegrees = 180,
  onPreviewGenerated,
  previewOnceKey,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewGeneratedRef = useRef<string | number | null>(null);
  const [error, setError] = useState(false);
  const [animations, setAnimations] = useState<string[]>([]);
  const [activeAnimation, setActiveAnimation] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const modelSrc = resolveMediaPath(src);

    if (!container || !modelSrc) {
      return undefined;
    }

    let disposed = false;
    let frame = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let activeAction: THREE.AnimationAction | null = null;
    let controls: OrbitControls | null = null;
    let modelLoaded = false;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: Boolean(onPreviewGenerated),
    });
    const loader = new GLTFLoader();

    setError(false);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(onPreviewGenerated ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8bb28f, 1.85));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.5, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfe8c6, 1.15);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);

      if (onPreviewGenerated) {
        camera.aspect = PREVIEW_CAPTURE_WIDTH / PREVIEW_CAPTURE_HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize(PREVIEW_CAPTURE_WIDTH, PREVIEW_CAPTURE_HEIGHT, false);
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const emitPreview = () => {
      const canvas = renderer.domElement;

      if (canvas.toBlob) {
        canvas.toBlob(
          (blob) => {
            if (!blob || disposed) {
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              if (!disposed && typeof reader.result === "string") {
                onPreviewGenerated?.(reader.result);
              }
            };
            reader.readAsDataURL(blob);
          },
          "image/webp",
          0.94,
        );
        return;
      }

      onPreviewGenerated?.(canvas.toDataURL("image/webp", 0.94));
    };

    const playClip = (clips: THREE.AnimationClip[], index: number) => {
      if (!mixer || clips.length === 0) {
        return;
      }

      activeAction?.fadeOut(0.12);
      const nextClip = clips[Math.max(0, Math.min(index, clips.length - 1))];
      activeAction = mixer.clipAction(nextClip);
      activeAction.reset().fadeIn(0.12);

      if (playing) {
        activeAction.play();
      }
    };

    loader.load(
      modelSrc,
      (gltf) => {
        if (disposed) {
          return;
        }

        const root = gltf.scene;
        root.rotation.y += THREE.MathUtils.degToRad(yawDegrees);
        scene.add(root);

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);

        root.position.sub(center);

        const distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * MODEL_FRAME_PADDING;
        camera.near = Math.max(0.01, maxDim / 100);
        camera.far = Math.max(100, maxDim * 100);
        camera.position.set(distance * 0.78, distance * 0.48, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        if (interactive) {
          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.target.set(0, 0, 0);
          controls.minDistance = maxDim * 0.65;
          controls.maxDistance = maxDim * 8;
          controls.update();
        }

        setAnimations(gltf.animations.map((clip) => clip.name || "Animation"));

        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(root);
          playClip(gltf.animations, activeAnimation);
        }

        modelLoaded = true;
      },
      undefined,
      () => {
        if (!disposed) {
          setError(true);
        }
      },
    );

    const animate = () => {
      if (disposed) {
        return;
      }

      frame = window.requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixer?.update(playing ? delta : 0);
      controls?.update();
      resize();
      renderer.render(scene, camera);

      if (
        onPreviewGenerated &&
        previewGeneratedRef.current !== previewOnceKey &&
        modelLoaded &&
        renderer.domElement.width > 1
      ) {
        previewGeneratedRef.current = previewOnceKey ?? "generated";
        window.setTimeout(() => {
          if (!disposed) {
            emitPreview();
          }
        }, 180);
      }
    };

    animate();

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      controls?.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;

        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer.domElement.remove();
    };
  }, [activeAnimation, interactive, onPreviewGenerated, playing, previewOnceKey, src, yawDegrees]);

  return (
    <div className={`model-viewer ${className}`} aria-label={`Modèle 3D ${title}`}>
      <div className="model-viewer-canvas" ref={containerRef} />
      {watermark ? <img className="model-watermark" src={watermarkUrl} alt="" loading="lazy" /> : null}
      {error ? <div className="model-viewer-error">Le modèle 3D n’a pas pu être chargé.</div> : null}
      {interactive && animations.length > 0 ? (
        <div className="model-controls">
          <label>
            Animation
            <select value={activeAnimation} onChange={(event) => setActiveAnimation(Number(event.target.value))}>
              {animations.map((name, index) => (
                <option key={`${name}-${index}`} value={index}>
                  {name || `Animation ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setPlaying((current) => !current)}>
            {playing ? "Pause" : "Lecture"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

