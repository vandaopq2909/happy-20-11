import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';

const GOLD = 0xe8c77a;
const ROSE = 0xf6bfd6;
const PLUM = 0xb56d92;

function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.16, 'rgba(255,237,214,.95)');
  gradient.addColorStop(0.42, 'rgba(246,191,214,.42)');
  gradient.addColorStop(1, 'rgba(246,191,214,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(3,1,7,.72)');
  gradient.addColorStop(0.45, 'rgba(3,1,7,.34)');
  gradient.addColorStop(1, 'rgba(3,1,7,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Builds the real-time 3D gift. Everything is intentionally low-poly:
 * one rounded box, a lid, ribbons, a bow, a glow disc and ~85 sprites.
 */
export function createGiftScene(container, options = {}) {
  if (!container) throw new Error('Gift canvas container is missing.');

  const lowPower = Boolean(options.lowPower);
  const reduced = Boolean(options.reducedMotion);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !lowPower && (window.devicePixelRatio || 1) < 2.1,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.domElement.style.background = 'transparent';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 2.0, 8.6);
  camera.lookAt(0, 0.55, 0);

  const world = new THREE.Group();
  scene.add(world);

  const glowTexture = makeGlowTexture();
  const shadowTexture = makeShadowTexture();

  // Shadow blob.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.005, 0.25);
  world.add(shadow);

  // Soft circular halo behind the box. A circle (not a plane) keeps the
  // browser from ever revealing a faint rectangular canvas edge.
  const backdropGlow = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 64),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
    }),
  );
  backdropGlow.position.set(0, 1.5, -2.2);
  world.add(backdropGlow);

  // Box body.
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: PLUM,
    roughness: 0.34,
    metalness: 0.12,
    clearcoat: 0.6,
    clearcoatRoughness: 0.32,
    sheen: 0.7,
    sheenColor: new THREE.Color(0xffd5e4),
  });
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.26, 2.4, 4, 0.06), bodyMaterial);
  body.position.y = 0.64;
  world.add(body);

  // Lid group pivots at its back edge so it opens like a real gift box.
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 1.27, -1.22);
  world.add(lidPivot);

  const lidMaterial = new THREE.MeshPhysicalMaterial({
    color: ROSE,
    roughness: 0.28,
    metalness: 0.16,
    clearcoat: 0.72,
    clearcoatRoughness: 0.24,
    sheen: 0.8,
    sheenColor: new THREE.Color(0xfff2f6),
  });
  const lid = new THREE.Mesh(new RoundedBoxGeometry(2.58, 0.3, 2.58, 4, 0.07), lidMaterial);
  lid.position.set(0, 0.14, 1.22);
  lidPivot.add(lid);

  // Gold edge on the lid.
  const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.59, 0.31, 2.59));
  const lidEdge = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55 }),
  );
  lidEdge.position.copy(lid.position);
  lidPivot.add(lidEdge);

  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xea8eb5,
    roughness: 0.3,
    metalness: 0.24,
    clearcoat: 0.55,
    emissive: new THREE.Color(0x3a1524),
    emissiveIntensity: 0.1,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.26,
    metalness: 0.8,
    emissive: new THREE.Color(0x6b4a18),
    emissiveIntensity: 0.18,
  });

  // Ribbons on body: two bands crossing the box.
  const ribbonThickness = 0.22;
  const makeStrip = (geometry, material, position, rotation) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    world.add(mesh);
    return mesh;
  };
  const frontBandGeometry = new THREE.BoxGeometry(ribbonThickness, 1.27, 0.035);
  const sideBandGeometry = new THREE.BoxGeometry(0.035, 1.27, 2.41);
  makeStrip(frontBandGeometry, ribbonMaterial, new THREE.Vector3(0, 0.64, 1.213));
  makeStrip(frontBandGeometry, ribbonMaterial, new THREE.Vector3(0, 0.64, -1.213));
  makeStrip(sideBandGeometry, ribbonMaterial, new THREE.Vector3(1.213, 0.64, 0));
  makeStrip(sideBandGeometry, ribbonMaterial, new THREE.Vector3(-1.213, 0.64, 0));

  // Ribbons across the lid.
  const lidBandA = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 2.58), ribbonMaterial);
  lidBandA.position.set(0, 0.3, 1.22);
  lidPivot.add(lidBandA);
  const lidBandB = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.035, 0.24), ribbonMaterial);
  lidBandB.position.set(0, 0.3, 1.22);
  lidPivot.add(lidBandB);

  // Gold monogram plate.
  const crestRing = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.011, 8, 48), goldMaterial);
  crestRing.position.set(0, 0.72, 1.22);
  world.add(crestRing);
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), goldMaterial);
  crest.position.set(0, 0.72, 1.235);
  world.add(crest);

  // Bow: two loops, a knot and tails.
  const bow = new THREE.Group();
  bow.position.set(0, 0.34, 1.22);
  lidPivot.add(bow);

  const loopGeometry = new THREE.TorusGeometry(0.31, 0.052, 8, 40, Math.PI * 1.42);
  const loopA = new THREE.Mesh(loopGeometry, ribbonMaterial);
  loopA.rotation.set(0.18, 0.28, -0.42);
  loopA.position.set(-0.31, 0.24, 0);
  loopA.scale.set(1.08, 0.74, 1);
  bow.add(loopA);

  const loopB = new THREE.Mesh(loopGeometry, ribbonMaterial);
  loopB.rotation.set(-0.18, -0.28, Math.PI + 0.42);
  loopB.position.set(0.31, 0.24, 0);
  loopB.scale.set(1.08, 0.74, 1);
  bow.add(loopB);

  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), goldMaterial);
  knot.position.set(0, 0.22, 0);
  knot.scale.y = 0.82;
  bow.add(knot);

  const tailCurveLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.03, 0.1, 0.02),
    new THREE.Vector3(-0.24, 0.01, 0.22),
    new THREE.Vector3(-0.36, -0.03, 0.46),
    new THREE.Vector3(-0.42, 0.02, 0.58),
  ]);
  const tailCurveRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.1, 0.02),
    new THREE.Vector3(0.24, 0.02, 0.23),
    new THREE.Vector3(0.34, -0.04, 0.45),
    new THREE.Vector3(0.4, 0.01, 0.59),
  ]);
  const tailA = new THREE.Mesh(new THREE.TubeGeometry(tailCurveLeft, 18, 0.035, 6, false), ribbonMaterial);
  const tailB = new THREE.Mesh(new THREE.TubeGeometry(tailCurveRight, 18, 0.035, 6, false), ribbonMaterial);
  bow.add(tailA, tailB);

  // Inner light and glow plane.
  const innerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  innerGlow.rotation.x = -Math.PI / 2;
  innerGlow.position.y = 1.27;
  world.add(innerGlow);

  const innerLight = new THREE.PointLight(0xffd8a6, 0, 10, 2);
  innerLight.position.set(0, 1.5, 0);
  world.add(innerLight);

  // Tiny golden ember inside the box.
  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffe7ba }),
  );
  ember.position.set(0, 1.35, 0);
  ember.visible = false;
  world.add(ember);

  // Floating sparkles around the gift.
  const sparkleCount = reduced ? 24 : lowPower ? 46 : 82;
  const sparklePositions = new Float32Array(sparkleCount * 3);
  const sparkleSeeds = [];
  for (let index = 0; index < sparkleCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 2.4;
    const y = 0.2 + Math.random() * 3.4;
    sparklePositions[index * 3] = Math.cos(angle) * radius;
    sparklePositions[index * 3 + 1] = y;
    sparklePositions[index * 3 + 2] = Math.sin(angle) * radius;
    sparkleSeeds.push({
      angle,
      radius,
      y,
      speed: 0.05 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const sparkleGeometry = new THREE.BufferGeometry();
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
  const sparkleMaterial = new THREE.PointsMaterial({
    color: 0xffd6e8,
    map: glowTexture,
    size: 0.15,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
  world.add(sparkles);

  // Inner burst points; hidden until opening.
  const burstCount = reduced ? 28 : lowPower ? 54 : 110;
  const burstPositions = new Float32Array(burstCount * 3);
  const burstSeeds = [];
  for (let index = 0; index < burstCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.1 + Math.random() * 0.7;
    burstPositions[index * 3] = Math.cos(angle) * radius;
    burstPositions[index * 3 + 1] = 1.2 + Math.random() * 0.35;
    burstPositions[index * 3 + 2] = Math.sin(angle) * radius;
    burstSeeds.push({
      angle,
      radius: 0.8 + Math.random() * 3.2,
      y: 1.5 + Math.random() * 2.6,
      speed: 0.5 + Math.random() * 0.5,
      size: 0.06 + Math.random() * 0.1,
    });
  }
  const burstGeometry = new THREE.BufferGeometry();
  burstGeometry.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
  const burstMaterial = new THREE.PointsMaterial({
    color: 0xffe9c6,
    map: glowTexture,
    size: 0.17,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const burst = new THREE.Points(burstGeometry, burstMaterial);
  burst.visible = false;
  world.add(burst);

  // Lights.
  scene.add(new THREE.HemisphereLight(0xffd8ec, 0x160b22, 1.35));
  const key = new THREE.DirectionalLight(0xffe3c6, 2.5);
  key.position.set(-4.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9b79d6, 1.75);
  rim.position.set(5, 2.5, -4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xf6bfd6, 2.5, 18, 2);
  fill.position.set(0, 3.6, 4.2);
  scene.add(fill);

  world.position.y = -0.72;
  world.rotation.y = -0.16;
  world.rotation.x = 0.03;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let active = true;
  let running = false;
  let opened = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width || 320);
    height = Math.max(1, rect.height || 320);
    dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width / height < 0.92 ? 38 : 34;
    camera.position.z = width / height < 0.92 ? 9.3 : 8.4;
    camera.updateProjectionMatrix();
  };

  const render = (timestamp = 0) => {
    if (!running || disposed) return;
    raf = requestAnimationFrame(render);
    const delta = last ? Math.min((timestamp - last) / 1000, 0.05) : 0.016;
    last = timestamp;
    elapsed += delta;

    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;

    const bob = Math.sin(elapsed * 0.82) * 0.035;
    world.position.y = -0.72 + bob;
    world.rotation.y = -0.16 + Math.sin(elapsed * 0.27) * 0.055 + pointerX * 0.11;
    world.rotation.x = 0.03 + pointerY * 0.035;
    backdropGlow.material.opacity = 0.3 + Math.sin(elapsed * 0.9) * 0.05;

    if (!opened) {
      lidPivot.rotation.x = Math.sin(elapsed * 0.9) * 0.006;
      crest.rotation.y += delta * 0.5;
    }

    // Orbiting sparkles.
    const positions = sparkleGeometry.attributes.position.array;
    for (let index = 0; index < sparkleSeeds.length; index += 1) {
      const seed = sparkleSeeds[index];
      const angle = seed.angle + elapsed * seed.speed;
      positions[index * 3] = Math.cos(angle) * seed.radius;
      positions[index * 3 + 1] = seed.y + Math.sin(elapsed * 0.7 + seed.phase) * 0.16;
      positions[index * 3 + 2] = Math.sin(angle) * seed.radius;
    }
    sparkleGeometry.attributes.position.needsUpdate = true;
    sparkles.rotation.y = elapsed * 0.035;

    if (opened) {
      const burstPositionsArray = burstGeometry.attributes.position.array;
      const progress = Math.min(1, (elapsed - openTime) / 2.2);
      for (let index = 0; index < burstSeeds.length; index += 1) {
        const seed = burstSeeds[index];
        const radius = seed.radius * (0.18 + progress * 0.82);
        burstPositionsArray[index * 3] = Math.cos(seed.angle) * radius;
        burstPositionsArray[index * 3 + 1] =
          1.2 + (seed.y - 1.2) * (0.2 + progress * 1.15) + Math.sin(elapsed * 1.8 + index) * 0.05;
        burstPositionsArray[index * 3 + 2] = Math.sin(seed.angle) * radius;
      }
      burstGeometry.attributes.position.needsUpdate = true;
      burst.rotation.y = elapsed * 0.08;
    }

    renderer.render(scene, camera);
  };

  let openTime = 0;

  const start = () => {
    if (running || disposed) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(render);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    const rect = container.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const onPointerLeave = () => {
    targetX = 0;
    targetY = 0;
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      stop();
    } else if (active) {
      start();
    }
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  start();

  const open = () => {
    if (opened) return Promise.resolve();
    opened = true;
    openTime = elapsed;
    burst.visible = true;
    ember.visible = true;

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: resolve,
      });

      timeline
        .to(world.rotation, { z: 0.028, duration: 0.075, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 0)
        .to(world.position, { x: 0.045, duration: 0.075, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 0)
        .set(world.position, { x: 0 }, 0.62)
        .to(lidPivot.rotation, { x: -1.92, duration: 1.3, ease: 'power4.inOut' }, 0.45)
        .to(
          lid.position,
          { x: 0.03, y: 0.24, duration: 1.2, ease: 'power2.out' },
          0.45,
        )
        .to(
          innerGlow.material,
          { opacity: 0.95, duration: 0.7, ease: 'power2.out' },
          0.55,
        )
        .to(innerGlow.scale, { x: 2.2, y: 2.2, z: 2.2, duration: 1.5, ease: 'power3.out' }, 0.55)
        .to(innerLight, { intensity: 12, duration: 0.8, ease: 'power2.out' }, 0.55)
        .to(
          burstMaterial,
          { opacity: 1, duration: 0.12, ease: 'power1.out' },
          0.62,
        )
        .to(
          burst.scale,
          { x: 1.55, y: 1.55, z: 1.55, duration: 1.5, ease: 'power3.out' },
          0.62,
        )
        .to(burstMaterial, { opacity: 0, duration: 1.15, ease: 'power2.in' }, 1.25)
        .to(camera.position, { z: camera.position.z - 1.05, duration: 2.1, ease: 'power2.inOut' }, 0)
        .to(world.rotation, { y: world.rotation.y + 0.2, duration: 2.2, ease: 'power2.inOut' }, 0)
        .to(sparkleMaterial, { opacity: 1, duration: 0.6 }, 0.5)
        .to(ember.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.8, yoyo: true, repeat: 1 }, 0.7);
    });
  };

  const setActive = (isActive) => {
    active = Boolean(isActive);
    if (active) start();
    else stop();
  };

  const reset = () => {
    opened = false;
    openTime = 0;
    burst.visible = false;
    burstMaterial.opacity = 0;
    burst.scale.set(1, 1, 1);
    ember.visible = false;
    ember.scale.set(1, 1, 1);
    innerGlow.material.opacity = 0;
    innerGlow.scale.set(1, 1, 1);
    innerLight.intensity = 0;
    lidPivot.rotation.x = 0;
    lid.position.set(0, 0.14, 1.22);
    sparkleMaterial.opacity = 0.82;
    camera.position.z = width / height < 0.92 ? 9.3 : 8.4;
    world.rotation.set(0.03, -0.16, 0);
    world.position.set(0, -0.72, 0);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stop();
    observer.disconnect();
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibility);
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value && value.isTexture) value.dispose();
          });
          material.dispose();
        });
      }
    });
    glowTexture.dispose();
    shadowTexture.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return {
    open,
    reset,
    setActive,
    dispose,
    isOpen: () => opened,
    __debug: { renderer, scene, camera, world },
  };
}
