import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroVisual() {
  const host = useRef(null);

  useEffect(() => {
    if (!host.current) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      host.current.classList.add("hero-preview--fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.current.clientWidth, host.current.clientHeight);
    host.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, host.current.clientWidth / host.current.clientHeight, 0.1, 100);
    camera.position.z = 8;
    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.BoxGeometry(4.7, 3.2, 0.12);
    const material = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7, metalness: 0.05 });
    const mail = new THREE.Mesh(geometry, material);
    group.add(mail);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x5b5bf0 });
    const points = [
      new THREE.Vector3(-1.75, 0.9, 0.12),
      new THREE.Vector3(0, -0.8, 0.12),
      new THREE.Vector3(1.75, 0.9, 0.12),
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(lineGeometry, lineMaterial));

    const dotGeometry = new THREE.SphereGeometry(0.035, 12, 12);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
    for (let i = 0; i < 18; i += 1) {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.set((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2);
      dot.userData.baseY = dot.position.y;
      group.add(dot);
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(4, 5, 6);
    scene.add(key);
    group.rotation.z = -0.08;

    let frame;
    const onMove = (event) => {
      const rect = host.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      group.rotation.y = x * 0.18;
      group.rotation.x = -y * 0.12;
    };
    host.current.addEventListener("pointermove", onMove);

    const animate = () => {
      if (!reduce) {
        group.rotation.z = -0.08 + Math.sin(Date.now() * 0.0005) * 0.02;
        group.children.forEach((child) => {
          if (child.userData.baseY !== undefined) child.position.y = child.userData.baseY + Math.sin(Date.now() * 0.001 + child.position.x) * 0.08;
        });
      }
      renderer.render(scene, camera);
      if (!reduce) frame = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      if (!host.current) return;
      renderer.setSize(host.current.clientWidth, host.current.clientHeight);
      camera.aspect = host.current.clientWidth / host.current.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      host.current?.removeEventListener("pointermove", onMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
    };
  }, []);

  return (
    <div ref={host} className="hero-preview" aria-label="Animated EmailPilot envelope visual">
      <div className="hero-preview__label"><span>Inbox status</span><strong>12 messages processed</strong></div>
    </div>
  );
}
