import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AppMode } from '../types';

type SpatialSceneProps = { mode: AppMode };

const makeSealContour = (radius: number) => {
  const shape = new THREE.Shape();
  const points = 96;
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    // Keep the wax silhouette round like the VaultNote stamp mark.
    const edge = radius * (1 + .026 * Math.cos(angle * 12));
    const x = Math.cos(angle) * edge;
    const y = Math.sin(angle) * edge;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: .12,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: .055,
    bevelThickness: .065,
    curveSegments: 18,
  });
};

const makeMonogram = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-.38, .34);
  shape.lineTo(-.18, .34);
  shape.lineTo(0, -.08);
  shape.lineTo(.18, .34);
  shape.lineTo(.38, .34);
  shape.lineTo(.11, -.37);
  shape.lineTo(-.11, -.37);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .026, bevelEnabled: true, bevelSegments: 2, bevelSize: .015, bevelThickness: .012 });
};

const makeBookMark = () => {
  const mark = new THREE.Group();
  const ivory = new THREE.MeshPhysicalMaterial({ color: '#fff8e8', roughness: .52, clearcoat: .12 });
  const pagePaths = [
    [[-.43, .34], [-.08, .27], [-.025, -.3], [-.4, -.22], [-.43, .34]],
    [[.43, .34], [.08, .27], [.025, -.3], [.4, -.22], [.43, .34]],
  ];
  pagePaths.forEach((points) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    const outline = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .022, 6, false), ivory);
    mark.add(outline);
  });
  const spine = new THREE.Mesh(new RoundedBoxGeometry(.035, .58, .04, .015, 3), ivory);
  spine.position.set(0, .005, 0);
  mark.add(spine);
  const v = new THREE.Mesh(makeMonogram(), ivory);
  v.scale.set(.72, .72, .72);
  v.position.z = .025;
  mark.add(v);
  return mark;
};

const makeFallbackFabric = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  context.fillStyle = '#e2d6c1';
  context.fillRect(0, 0, 512, 512);
  context.strokeStyle = 'rgba(255,250,237,.54)';
  context.lineWidth = 2;
  for (let point = -512; point < 1024; point += 80) {
    context.beginPath();
    context.moveTo(point, 0);
    context.lineTo(point + 512, 512);
    context.stroke();
    context.beginPath();
    context.moveTo(point, 0);
    context.lineTo(point - 512, 512);
    context.stroke();
  }
  context.strokeStyle = 'rgba(151,126,90,.28)';
  context.lineWidth = 1;
  for (let point = -512; point < 1024; point += 80) {
    context.beginPath();
    context.moveTo(point, 0);
    context.lineTo(point + 512, 512);
    context.stroke();
    context.beginPath();
    context.moveTo(point, 0);
    context.lineTo(point - 512, 512);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
};

const SpatialScene: React.FC<SpatialSceneProps> = ({ mode }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const currentModeRef = useRef(mode);
  currentModeRef.current = mode;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.set(0, 0, 13);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      host.dataset.sceneUnavailable = 'true';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.4));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf1f8ff, 0x7b664b, 2.25));
    const keyLight = new THREE.DirectionalLight(0xfff0d4, 3.4);
    keyLight.position.set(-5, 8, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -.00025;
    scene.add(keyLight);
    const coolFill = new THREE.PointLight(0x9dc9ee, 18, 24);
    coolFill.position.set(7, 1, 6);
    scene.add(coolFill);
    const warmBounce = new THREE.PointLight(0xf5d8ad, 9, 19);
    warmBounce.position.set(-5, -4, 5);
    scene.add(warmBounce);

    const world = new THREE.Group();
    scene.add(world);
    const book = new THREE.Group();
    world.add(book);

    const fallbackFabric = makeFallbackFabric();
    const coverMaterial = new THREE.MeshPhysicalMaterial({ color: '#e1d5c1', map: fallbackFabric, roughness: .84, clearcoat: .14, clearcoatRoughness: .72 });
    const pageMaterial = new THREE.MeshPhysicalMaterial({ color: '#fffaf0', roughness: .93 });
    const pageEdgeMaterial = new THREE.MeshStandardMaterial({ color: '#e7dece', roughness: .96 });
    const forestWax = new THREE.MeshPhysicalMaterial({ color: '#42694f', roughness: .38, clearcoat: .82, clearcoatRoughness: .28 });
    const waxHighlight = new THREE.MeshPhysicalMaterial({ color: '#719476', roughness: .31, clearcoat: .88, clearcoatRoughness: .22 });
    const brass = new THREE.MeshPhysicalMaterial({ color: '#c4a269', metalness: .72, roughness: .29, clearcoat: .38 });
    const ribbonMaterial = new THREE.MeshPhysicalMaterial({ color: '#405f48', roughness: .63, sheen: .65, sheenColor: '#a6b995' });
    const textureLoader = new THREE.TextureLoader();
    const quiltTexture = textureLoader.load('/vaultnote-quilted-linen.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      coverMaterial.map = texture;
      coverMaterial.needsUpdate = true;
    });

    const softShadow = new THREE.Mesh(new THREE.CircleGeometry(5.6, 64), new THREE.MeshBasicMaterial({ color: '#55738c', transparent: true, opacity: .15 }));
    softShadow.scale.set(1.2, .37, 1);
    softShadow.position.set(.15, -3.42, -1.25);
    book.add(softShadow);

    const cover = new THREE.Mesh(new RoundedBoxGeometry(10.8, 5.9, .58, .3, 8), coverMaterial);
    cover.position.z = -.2;
    cover.castShadow = true;
    cover.receiveShadow = true;
    book.add(cover);

    const pageBlock = new THREE.Mesh(new RoundedBoxGeometry(10.42, 5.52, .3, .16, 7), pageEdgeMaterial);
    pageBlock.position.set(0, .04, .17);
    pageBlock.castShadow = true;
    pageBlock.receiveShadow = true;
    book.add(pageBlock);

    for (let layer = 0; layer < 4; layer += 1) {
      const pageEdge = new THREE.Mesh(new RoundedBoxGeometry(10.25, 5.36, .035, .08, 5), layer % 2 ? pageMaterial : pageEdgeMaterial);
      pageEdge.position.set(0, .035, .29 + layer * .038);
      pageEdge.receiveShadow = true;
      book.add(pageEdge);
    }

    const leftPage = new THREE.Mesh(new RoundedBoxGeometry(5.07, 5.28, .12, .12, 7), pageMaterial);
    leftPage.position.set(-2.56, .08, .46);
    leftPage.castShadow = true;
    leftPage.receiveShadow = true;
    book.add(leftPage);
    const rightPage = new THREE.Mesh(new RoundedBoxGeometry(5.07, 5.28, .12, .12, 7), pageMaterial);
    rightPage.position.set(2.56, .08, .46);
    rightPage.castShadow = true;
    rightPage.receiveShadow = true;
    book.add(rightPage);

    const spine = new THREE.Mesh(new RoundedBoxGeometry(.56, 5.67, .54, .2, 7), coverMaterial);
    spine.position.set(0, .01, .06);
    spine.castShadow = true;
    book.add(spine);
    const spineGilt = new THREE.Mesh(new RoundedBoxGeometry(.055, 5.12, .07, .025, 4), brass);
    spineGilt.position.set(.13, .02, .36);
    book.add(spineGilt);

    const bookmarkRibbon = new THREE.Mesh(new RoundedBoxGeometry(.2, 5.85, .1, .08, 5), ribbonMaterial);
    bookmarkRibbon.position.set(4.35, -.08, .55);
    bookmarkRibbon.rotation.z = -.025;
    bookmarkRibbon.castShadow = true;
    book.add(bookmarkRibbon);

    const createWaxSeal = (radius: number, materials = { wax: forestWax, highlight: waxHighlight }) => {
      const seal = new THREE.Group();
      const outer = new THREE.Mesh(makeSealContour(radius), materials.wax);
      outer.castShadow = true;
      outer.receiveShadow = true;
      seal.add(outer);
      const raisedFace = new THREE.Mesh(new THREE.CircleGeometry(radius * .82, 64), materials.highlight);
      raisedFace.position.z = .178;
      raisedFace.castShadow = true;
      seal.add(raisedFace);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * .78, radius * .022, 14, 64), materials.wax);
      rim.position.z = .196;
      seal.add(rim);
      const mark = makeBookMark();
      mark.position.set(0, 0, .214);
      mark.scale.setScalar(radius * .78);
      mark.traverse((part) => {
        if (part instanceof THREE.Mesh) part.castShadow = true;
      });
      seal.add(mark);
      return seal;
    };

    const bookSeal = createWaxSeal(.52);
    bookSeal.position.set(-3.72, .72, .84);
    book.add(bookSeal);

    const flyleafMark = new THREE.Mesh(new THREE.CircleGeometry(.035, 24), brass);
    flyleafMark.position.set(3.4, 2.33, .57);
    book.add(flyleafMark);

    const origami = new THREE.Group();
    book.add(origami);
    const origamiShape = new THREE.Shape();
    origamiShape.moveTo(0, .28);
    origamiShape.lineTo(-.38, -.12);
    origamiShape.lineTo(0, -.26);
    origamiShape.lineTo(.38, -.12);
    origamiShape.closePath();
    const origamiMaterial = new THREE.MeshPhysicalMaterial({ color: '#fff8e9', side: THREE.DoubleSide, roughness: .72, clearcoat: .1 });
    const foldedBird = new THREE.Mesh(new THREE.ShapeGeometry(origamiShape, 1), origamiMaterial);
    foldedBird.position.set(3.92, 1.35, .88);
    foldedBird.rotation.z = -.2;
    foldedBird.castShadow = true;
    origami.add(foldedBird);

    const propGroup = new THREE.Group();
    book.add(propGroup);

    const envelopeProp = new THREE.Group();
    propGroup.add(envelopeProp);
    envelopeProp.position.set(-2.63, -.03, 1.03);
    const envelopePaper = new THREE.MeshPhysicalMaterial({ color: '#d8c092', roughness: .78, clearcoat: .18 });
    const envelopeFace = new THREE.Mesh(new RoundedBoxGeometry(4.18, 2.72, .18, .13, 6), envelopePaper);
    envelopeFace.castShadow = true;
    envelopeFace.receiveShadow = true;
    envelopeProp.add(envelopeFace);
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-2.02, 0);
    flapShape.lineTo(2.02, 0);
    flapShape.lineTo(0, -1.22);
    flapShape.closePath();
    const envelopeFlapPivot = new THREE.Group();
    envelopeFlapPivot.position.set(0, 1.32, .12);
    envelopeProp.add(envelopeFlapPivot);
    const envelopeFlap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape, 2), new THREE.MeshPhysicalMaterial({ color: '#cbb083', side: THREE.DoubleSide, roughness: .82 }));
    envelopeFlap.position.y = -.02;
    envelopeFlap.castShadow = true;
    envelopeFlapPivot.add(envelopeFlap);
    const envelopeSeal = createWaxSeal(.42);
    envelopeSeal.position.set(0, .02, .24);
    envelopeProp.add(envelopeSeal);

    const passwordProp = new THREE.Group();
    propGroup.add(passwordProp);
    passwordProp.position.set(-2.55, -.15, 1.1);
    const keyMetal = new THREE.MeshPhysicalMaterial({ color: '#bc965d', metalness: .74, roughness: .24, clearcoat: .48 });
    const keyShadow = new THREE.Mesh(new THREE.CircleGeometry(1.08, 48), new THREE.MeshPhysicalMaterial({ color: '#eff4eb', roughness: .72, clearcoat: .12 }));
    keyShadow.position.set(-1.27, .05, -.08);
    passwordProp.add(keyShadow);
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(.82, .16, 22, 72), keyMetal);
    keyRing.position.set(-1.27, .05, .12);
    keyRing.castShadow = true;
    passwordProp.add(keyRing);
    const keyHeadInlay = new THREE.Mesh(new THREE.TorusGeometry(.48, .025, 14, 64), forestWax);
    keyHeadInlay.position.set(-1.27, .05, .29);
    passwordProp.add(keyHeadInlay);
    const keyShaft = new THREE.Mesh(new RoundedBoxGeometry(3.28, .26, .22, .12, 5), keyMetal);
    keyShaft.position.set(.63, .05, .1);
    keyShaft.castShadow = true;
    passwordProp.add(keyShaft);
    const keyTip = new THREE.Mesh(new THREE.ConeGeometry(.34, .55, 4), keyMetal);
    keyTip.position.set(2.32, .05, .1);
    keyTip.rotation.z = -Math.PI / 2;
    passwordProp.add(keyTip);
    const keyToothA = new THREE.Mesh(new RoundedBoxGeometry(.26, .52, .19, .08, 4), keyMetal);
    keyToothA.position.set(.1, -.23, .1);
    keyToothA.castShadow = true;
    passwordProp.add(keyToothA);
    const keyToothB = new THREE.Mesh(new RoundedBoxGeometry(.26, .42, .19, .08, 4), keyMetal);
    keyToothB.position.set(.77, -.18, .1);
    keyToothB.castShadow = true;
    passwordProp.add(keyToothB);

    const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#fbfdff', roughness: 1, transparent: true, opacity: .46, depthWrite: false });
    const clouds: THREE.Group[] = [];
    const cloudBaseX: number[] = [];
    const addCloud = (x: number, y: number, scale: number) => {
      const cloud = new THREE.Group();
      for (let index = 0; index < 5; index += 1) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(.52 + (index % 2) * .1, 24, 18), cloudMaterial);
        puff.position.set((index - 2) * .58, Math.sin(index * 1.65) * .13, -2.25 - index * .035);
        puff.scale.y = .74;
        cloud.add(puff);
      }
      cloud.position.set(x, y, -2.3);
      cloud.scale.setScalar(scale);
      scene.add(cloud);
      clouds.push(cloud);
      cloudBaseX.push(x);
    };
    addCloud(-7.5, -3.45, 1.2);
    addCloud(7.5, -3.65, 1.35);
    addCloud(-7.4, 3.5, 1.08);
    addCloud(7.2, 3.25, 1.1);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      pointer.x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let lastMode = currentModeRef.current;
    let modeChangedAt = performance.now();
    let stampStartedAt = -10000;
    let unlockStartedAt = -10000;
    let keyStartedAt = -10000;
    let unlocked = false;
    const triggerStamp = () => { stampStartedAt = performance.now(); };
    const triggerUnlock = () => { unlockStartedAt = performance.now(); unlocked = true; };
    const triggerKey = () => { keyStartedAt = performance.now(); };
    window.addEventListener('vaultnote:stamp', triggerStamp);
    window.addEventListener('vaultnote:unlock', triggerUnlock);
    window.addEventListener('vaultnote:key', triggerKey);

    let envelopeBaseScale = .64;
    let passwordBaseScale = .66;
    let passwordBaseRotationZ = 0;
    let showResponsiveProps = true;
    const resizeObserver = new ResizeObserver(() => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      showResponsiveProps = width >= 350;
      camera.aspect = width / height;
      if (width < 620) {
        camera.position.z = 15.5;
        world.rotation.z = -Math.PI / 2;
        world.position.set(0, 0, 0);
        book.scale.setScalar(.9);
        const targetHeight = Math.max(10.8 * .9, (5.9 * .9) / camera.aspect) * 1.08;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(targetHeight / (2 * camera.position.z)));
        softShadow.scale.set(.06, .42, 1);
        softShadow.position.set(3.42, 0, -1.25);
        envelopeBaseScale = .36;
        passwordBaseScale = .38;
        passwordBaseRotationZ = Math.PI / 2;
        envelopeProp.position.set(-4.6, 1.05, 1.03);
        envelopeProp.rotation.z = Math.PI / 2;
        passwordProp.position.set(height > 680 ? -5.1 : -4.6, 1, 1.1);
        passwordProp.rotation.z = passwordBaseRotationZ;
      } else if (width < 1040) {
        camera.position.z = 13.8;
        world.rotation.z = 0;
        world.position.set(0, 0, 0);
        book.scale.setScalar(.82);
        const targetHeight = Math.max(5.9 * .82, (10.8 * .82) / camera.aspect) * 1.1;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(targetHeight / (2 * camera.position.z)));
        softShadow.scale.set(1.2, .37, 1);
        softShadow.position.set(.15, -3.42, -1.25);
        envelopeBaseScale = .64;
        passwordBaseScale = .66;
        passwordBaseRotationZ = 0;
        envelopeProp.position.set(-1.8, -.85, 1.03);
        envelopeProp.rotation.z = 0;
        passwordProp.position.set(-1.85, -.7, 1.1);
        passwordProp.rotation.z = 0;
      } else {
        camera.position.z = 13;
        world.rotation.z = 0;
        world.position.set(0, 0, 0);
        book.scale.setScalar(.9);
        const targetHeight = Math.max(5.9 * .9, (10.8 * .9) / camera.aspect) * 1.08;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(targetHeight / (2 * camera.position.z)));
        softShadow.scale.set(1.2, .37, 1);
        softShadow.position.set(.15, -3.42, -1.25);
        envelopeBaseScale = .64;
        passwordBaseScale = .66;
        passwordBaseRotationZ = 0;
        envelopeProp.position.set(-1.8, -.85, 1.03);
        envelopeProp.rotation.z = 0;
        passwordProp.position.set(-1.85, -.7, 1.1);
        passwordProp.rotation.z = 0;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(host);

    let animationFrame = 0;
    let lastFrame = 0;
    const animate = (now: number) => {
      animationFrame = window.requestAnimationFrame(animate);
      const delta = Math.min((now - (lastFrame || now)) / 1000, .04);
      lastFrame = now;
      const time = now * .0005;
      const activeMode = currentModeRef.current;

      if (activeMode !== lastMode) {
        lastMode = activeMode;
        modeChangedAt = now;
        unlocked = false;
        envelopeFlapPivot.rotation.x = 0;
        if (activeMode === AppMode.DecryptView) envelopeProp.scale.setScalar(envelopeBaseScale);
        if (activeMode === AppMode.PasswordGenerator) passwordProp.scale.setScalar(passwordBaseScale);
      }

      envelopeProp.visible = showResponsiveProps && activeMode === AppMode.DecryptView;
      passwordProp.visible = showResponsiveProps && activeMode === AppMode.PasswordGenerator;
      const modeAge = Math.min((now - modeChangedAt) / 520, 1);
      const entrance = 1 - Math.pow(1 - modeAge, 3);
      if (activeMode === AppMode.DecryptView) envelopeProp.scale.setScalar(envelopeBaseScale + entrance * .08);
      if (activeMode === AppMode.PasswordGenerator) passwordProp.scale.setScalar(passwordBaseScale + entrance * .08);
      if (unlocked) {
        const unlockProgress = Math.min((now - unlockStartedAt) / 640, 1);
        envelopeFlapPivot.rotation.x = -Math.sin(unlockProgress * Math.PI / 2) * 1.62;
      }

      const stampAge = (now - stampStartedAt) / 1000;
      if (stampAge >= 0 && stampAge < .74) {
        const drop = stampAge < .36 ? 1 - stampAge / .36 : Math.max(0, 1 - (stampAge - .36) / .38) * .16;
        const impact = stampAge < .36 ? 0 : Math.sin(((stampAge - .36) / .38) * Math.PI * 3) * Math.exp(-((stampAge - .36) / .38) * 5) * .1;
        bookSeal.position.y = .72 + drop * .88 + impact;
        bookSeal.rotation.z = Math.sin(stampAge * 9) * (1 - Math.min(stampAge / .36, 1)) * .12;
      } else {
        bookSeal.position.y = THREE.MathUtils.damp(bookSeal.position.y, .72, 8, delta);
        bookSeal.rotation.z = THREE.MathUtils.damp(bookSeal.rotation.z, 0, 8, delta);
      }

      const keyAge = (now - keyStartedAt) / 1000;
      if (keyAge >= 0 && keyAge < .9) {
        const eased = 1 - Math.pow(1 - Math.min(keyAge / .9, 1), 3);
        passwordProp.rotation.z = passwordBaseRotationZ + Math.sin(eased * Math.PI * 2) * .18 + (1 - eased) * -.22;
        passwordProp.rotation.y = Math.sin(eased * Math.PI * 2) * .11;
      } else {
        passwordProp.rotation.z = THREE.MathUtils.damp(passwordProp.rotation.z, passwordBaseRotationZ, 5, delta);
        passwordProp.rotation.y = THREE.MathUtils.damp(passwordProp.rotation.y, 0, 5, delta);
      }

      book.position.y = Math.sin(time) * .048;
      book.rotation.x = THREE.MathUtils.damp(book.rotation.x, -.024 + pointer.y * .022, 3.4, delta);
      book.rotation.y = THREE.MathUtils.damp(book.rotation.y, pointer.x * .045 + (activeMode === AppMode.PasswordGenerator ? .045 : 0), 3.4, delta);
      foldedBird.position.y = 1.35 + Math.sin(time * 1.8) * .075;
      foldedBird.rotation.z = -.2 + Math.sin(time * 1.15) * .055;
      clouds.forEach((cloud, index) => { cloud.position.x = cloudBaseX[index] + Math.sin(time * .32 + index * 1.7) * .16; });
      renderer.render(scene, camera);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('vaultnote:stamp', triggerStamp);
      window.removeEventListener('vaultnote:unlock', triggerUnlock);
      window.removeEventListener('vaultnote:key', triggerKey);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
          objectMaterials.forEach((material) => {
            materials.add(material);
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
          });
        }
      });
      textures.add(quiltTexture);
      if (fallbackFabric) textures.add(fallbackFabric);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="scene-root" ref={hostRef} aria-hidden="true" />;
};

export default SpatialScene;
