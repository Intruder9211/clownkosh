import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Minimize2, Sparkles, MessageSquare } from 'lucide-react';

export function Companion3D({ currentPage, totalPages, isReading }) {
  const mountRef = useRef(null);
  const [companionType, setCompanionType] = useState('wizzy'); // 'wizzy' | 'felix' | 'ollie' | 'bytes'
  const [speechBubble, setSpeechBubble] = useState('Hi! Let\'s read together! 📖');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFlippingPage, setIsFlippingPage] = useState(false);

  const sceneRef = useRef(null);
  const bookPagesGroupRef = useRef(null);
  const characterHeadRef = useRef(null);
  const characterArmRightRef = useRef(null);

  // Companion Color Schemes
  const COMPANIONS = {
    wizzy: { name: 'Wizzy the Wizard', color: 0x8b5cf6, hatColor: 0x6d28d9, skinColor: 0xc4b5fd },
    felix: { name: 'Felix the Fox', color: 0xf97316, hatColor: 0xc2410c, skinColor: 0xffedd5 },
    ollie: { name: 'Ollie the Owl', color: 0x84cc16, hatColor: 0x4d7c0f, skinColor: 0xecfccb },
    bytes: { name: 'Bytes the Robot', color: 0x06b6d4, hatColor: 0x0e7490, skinColor: 0xcffafe },
  };

  // Trigger page flip reaction & speech bubble when currentPage changes
  useEffect(() => {
    if (currentPage > 1) {
      setIsFlippingPage(true);
      const quotes = [
        `Awesome! Page ${currentPage} reached! 📖`,
        `Page ${currentPage} of ${totalPages}! Great reading speed! ⚡`,
        `Focus unlocked! Keep turnin' those pages! 🌟`,
        `Reading boost active! +10 XP earned! 🎯`,
        `Great chapter! You're making progress! 🚀`
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setSpeechBubble(randomQuote);

      const timer = setTimeout(() => {
        setIsFlippingPage(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalPages]);

  // Three.js 3D Engine Setup - Transparent Canvas (No Box)
  useEffect(() => {
    if (!mountRef.current || isMinimized) return;

    const width = 240;
    const height = 240;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.2);
    camera.lookAt(0, 0.4, 0);

    // 2. Renderer (Transparent Alpha Canvas)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // 100% Transparent background
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(COMPANIONS[companionType].color, 1.5, 5);
    pointLight.position.set(0, 0.8, 0.5);
    scene.add(pointLight);

    // 4. Create 3D Desk
    const deskGeo = new THREE.BoxGeometry(2.2, 0.1, 1.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 0, 0);
    scene.add(desk);

    // 5. Create 3D Open Book on Desk
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0, 0.1, 0.2);

    const coverGeo = new THREE.BoxGeometry(0.8, 0.04, 0.6);
    const coverMat = new THREE.MeshStandardMaterial({ color: COMPANIONS[companionType].color });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    bookGroup.add(cover);

    const pagesGeo = new THREE.BoxGeometry(0.76, 0.05, 0.56);
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const pages = new THREE.Mesh(pagesGeo, pagesMat);
    pages.position.y = 0.03;
    bookGroup.add(pages);

    // Animated Flip Page
    const flipPageGeo = new THREE.BoxGeometry(0.36, 0.01, 0.54);
    const flipPageMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
    const flipPage = new THREE.Mesh(flipPageGeo, flipPageMat);
    flipPage.position.set(0.18, 0.06, 0);
    bookGroup.add(flipPage);
    bookPagesGroupRef.current = flipPage;

    scene.add(bookGroup);

    // 6. Create 3D Character Body & Head
    const compConfig = COMPANIONS[companionType];

    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 0.05, -0.3);

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.7, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: compConfig.color, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    characterGroup.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({ color: compConfig.skinColor, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.95;
    characterHeadRef.current = head;

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.02, 0.28);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.02, 0.28);
    head.add(rightEye);

    // Hat
    const hatGeo = new THREE.ConeGeometry(0.28, 0.5, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: compConfig.hatColor });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 0.35, 0);
    hat.rotation.x = -0.15;
    head.add(hat);

    characterGroup.add(head);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12);
    const armMat = new THREE.MeshStandardMaterial({ color: compConfig.color });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.35, 0.45, 0.2);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.rotation.x = -Math.PI / 6;
    characterGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.35, 0.45, 0.2);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.rotation.x = -Math.PI / 6;
    characterArmRightRef.current = rightArm;
    characterGroup.add(rightArm);

    scene.add(characterGroup);

    // 7. Render Animation Loop
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      characterGroup.position.y = 0.05 + Math.sin(elapsedTime * 2) * 0.02;
      if (characterHeadRef.current) {
        characterHeadRef.current.rotation.y = Math.sin(elapsedTime * 1.2) * 0.1;
      }

      if (bookPagesGroupRef.current && isFlippingPage) {
        bookPagesGroupRef.current.rotation.z = Math.sin(elapsedTime * 15) * 0.8;
      } else if (bookPagesGroupRef.current) {
        bookPagesGroupRef.current.rotation.z = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [companionType, isMinimized, isFlippingPage]);

  if (isMinimized) {
    return (
      <div className="companion-minimized-badge" onClick={() => setIsMinimized(false)}>
        <span className="min-avatar">🧙‍♂️</span>
        <span className="min-label">3D Buddy</span>
        <Sparkles size={14} className="sparkle-icon" />
      </div>
    );
  }

  return (
    <div className="companion-3d-transparent-wrapper">
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="speech-bubble-cutout">
          <MessageSquare size={13} className="bubble-icon" />
          <span>{speechBubble}</span>
        </div>
      )}

      {/* Transparent Cutout 3D Canvas */}
      <div className="companion-cutout-container">
        <div ref={mountRef} className="three-canvas-transparent" />

        {/* Floating Mini Controls */}
        <div className="floating-mini-controls">
          <select 
            value={companionType} 
            onChange={(e) => setCompanionType(e.target.value)}
            className="mini-companion-select"
            title="Change 3D Character"
          >
            <option value="wizzy">🧙‍♂️ Wizzy</option>
            <option value="felix">🦊 Felix</option>
            <option value="ollie">🦉 Ollie</option>
            <option value="bytes">🤖 Bytes</option>
          </select>

          <button 
            onClick={() => setIsMinimized(true)} 
            className="mini-control-btn" 
            title="Minimize"
          >
            <Minimize2 size={12} />
          </button>
        </div>
      </div>

      <style>{`
        .companion-3d-transparent-wrapper {
          position: absolute;
          bottom: 1.25rem;
          right: 1.25rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
        }

        .speech-bubble-cutout {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.45rem 0.85rem;
          font-size: 0.775rem;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          gap: 0.4rem;
          max-width: 220px;
          margin-bottom: -15px;
          z-index: 10;
          animation: floatIn 0.3s ease;
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bubble-icon {
          color: var(--accent-color);
          flex-shrink: 0;
        }

        .companion-cutout-container {
          width: 220px;
          height: 220px;
          position: relative;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.35));
        }

        .three-canvas-transparent {
          width: 100%;
          height: 100%;
          background: transparent !important;
        }

        .floating-mini-controls {
          position: absolute;
          bottom: 0px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          opacity: 0.4;
          transition: opacity 0.2s ease;
        }

        .companion-cutout-container:hover .floating-mini-controls {
          opacity: 1;
        }

        .mini-companion-select {
          background-color: rgba(18, 20, 24, 0.85);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          padding: 0.15rem 0.35rem;
          outline: none;
          cursor: pointer;
          backdrop-filter: blur(4px);
        }

        .mini-control-btn {
          background-color: rgba(18, 20, 24, 0.85);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.15rem 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(4px);
        }

        .mini-control-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        /* Minimized Badge */
        .companion-minimized-badge {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 1000;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 0.4rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }

        .companion-minimized-badge:hover {
          transform: scale(1.05);
          border-color: var(--text-primary);
        }

        .min-avatar { font-size: 1.1rem; }
        .min-label { font-size: 0.8rem; font-weight: 600; }
        .sparkle-icon { color: #eab308; }

        @media (max-width: 640px) {
          .companion-cutout-container {
            width: 160px;
            height: 160px;
          }
          .speech-bubble-cutout {
            font-size: 0.7rem;
            max-width: 160px;
          }
        }
      `}</style>
    </div>
  );
}
