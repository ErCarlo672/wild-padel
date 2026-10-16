/* Wild Padel — escenas 3D (Three.js r128, sin módulos) */
(function () {
  'use strict';
  var W = (window.__WILD__ = window.__WILD__ || {});
  if (!window.THREE) { document.documentElement.classList.add('no-3d'); return; }
  var T = window.THREE;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

  function canvasTex(size, draw, repeatX, repeatY) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    var t = new T.CanvasTexture(c);
    if (repeatX) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeatX, repeatY); }
    t.anisotropy = 4;
    return t;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function onVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, { threshold: 0 }).observe(el);
  }

  /* =========================================================
     1. PISTA DE PÁDEL 3D (hero)
     ========================================================= */
  W.initCourt = function () {
    var canvas = document.getElementById('court3d');
    if (!canvas) return;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x07090d, 1);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    var scene = new T.Scene();
    scene.fog = new T.Fog(0x07090d, 22, 60);
    var camera = new T.PerspectiveCamera(42, 1, 0.1, 200);

    // Luces
    scene.add(new T.HemisphereLight(0x9fb8ff, 0x0b0d12, 0.55));
    var key = new T.DirectionalLight(0xffffff, 0.9); key.position.set(-6, 14, 8); scene.add(key);
    var warm = new T.PointLight(0xff6a2a, 2.2, 30, 2); warm.position.set(9, 4, -6); scene.add(warm);
    var cool = new T.PointLight(0x4f8bff, 1.6, 30, 2); cool.position.set(-9, 5, 6); scene.add(cool);

    // Suelo exterior
    var ground = new T.Mesh(new T.PlaneGeometry(120, 120), new T.MeshStandardMaterial({ color: 0x0b0f16, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);

    // Césped (textura de grano)
    var turfTex = canvasTex(256, function (g, s) {
      g.fillStyle = '#1f5fe0'; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 9000; i++) {
        var v = Math.random();
        g.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,40,0.12)';
        g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
      }
    }, 8, 4);
    turfTex.encoding = T.sRGBEncoding;
    var turf = new T.Mesh(new T.PlaneGeometry(20, 10), new T.MeshStandardMaterial({ map: turfTex, roughness: 0.85 }));
    turf.rotation.x = -Math.PI / 2; scene.add(turf);
    // Zona exterior de la pista (más oscura)
    var apron = new T.Mesh(new T.PlaneGeometry(22, 12), new T.MeshStandardMaterial({ color: 0x15367f, roughness: 0.9 }));
    apron.rotation.x = -Math.PI / 2; apron.position.y = -0.005; scene.add(apron);

    // Líneas
    var lineMat = new T.MeshBasicMaterial({ color: 0xffffff });
    function line(w, d, x, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, d), lineMat);
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z); scene.add(m);
    }
    line(0.05, 10, 6.95, 0); line(0.05, 10, -6.95, 0);
    line(13.9, 0.05, 0, 0);
    line(20, 0.05, 0, 5); line(20, 0.05, 0, -5); line(0.05, 10, 10, 0); line(0.05, 10, -10, 0);

    // Red
    var netTex = canvasTex(64, function (g, s) {
      g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(230,235,245,0.75)'; g.lineWidth = 2;
      g.strokeRect(0, 0, s, s);
    }, 60, 6);
    var net = new T.Mesh(new T.PlaneGeometry(10, 0.88), new T.MeshBasicMaterial({ map: netTex, transparent: true, side: T.DoubleSide, depthWrite: false }));
    net.rotation.y = Math.PI / 2; net.position.set(0, 0.44, 0); scene.add(net);
    var tape = new T.Mesh(new T.BoxGeometry(0.04, 0.06, 10), new T.MeshBasicMaterial({ color: 0xffffff }));
    tape.position.set(0, 0.88, 0); scene.add(tape);
    var postMat = new T.MeshStandardMaterial({ color: 0x15171c, metalness: 0.7, roughness: 0.35 });
    [-5.1, 5.1].forEach(function (z) {
      var p = new T.Mesh(new T.BoxGeometry(0.08, 0.95, 0.08), postMat); p.position.set(0, 0.47, z); scene.add(p);
    });

    // Cristales
    var glassMat = new T.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.2, side: T.DoubleSide, depthWrite: false });
    var edgeMat = new T.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.45 });
    function glass(w, h, x, y, z, ry) {
      var geo = new T.PlaneGeometry(w, h);
      var m = new T.Mesh(geo, glassMat); m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m);
      var e = new T.LineSegments(new T.EdgesGeometry(geo), edgeMat); e.position.copy(m.position); e.rotation.copy(m.rotation); scene.add(e);
    }
    // Fondos: 4 paneles de 2,5 m por lado
    [-10, 10].forEach(function (x) {
      for (var i = 0; i < 4; i++) glass(2.5, 3, x, 1.5, -3.75 + i * 2.5, Math.PI / 2);
    });
    // Laterales: 2 paneles de 2 m cerca de cada fondo
    [-5, 5].forEach(function (z) {
      [-9, -7, 7, 9].forEach(function (x) { glass(2, 3, x, 1.5, z, 0); });
    });

    // Malla metálica
    var meshTex = canvasTex(64, function (g, s) {
      g.clearRect(0, 0, s, s); g.strokeStyle = 'rgba(40,44,52,1)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(s, s); g.moveTo(s, 0); g.lineTo(0, s); g.stroke();
    }, 1, 1);
    function fence(w, h, x, y, z, ry) {
      var t = meshTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(w * 6, h * 6);
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, side: T.DoubleSide, depthWrite: false, opacity: 0.85 }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m);
    }
    [-5, 5].forEach(function (z) { fence(12, 3, 0, 1.5, z, 0); fence(4, 1, -8, 3.5, z, 0); fence(4, 1, 8, 3.5, z, 0); });
    [-10, 10].forEach(function (x) { fence(10, 1, x, 3.5, 0, Math.PI / 2); });

    // Postes
    var poleMat = new T.MeshStandardMaterial({ color: 0x3a404c, metalness: 0.9, roughness: 0.25 });
    function pole(x, z, h) { var p = new T.Mesh(new T.BoxGeometry(0.06, h, 0.06), poleMat); p.position.set(x, h / 2, z); scene.add(p); }
    for (var x = -10; x <= 10; x += 2) { var h = Math.abs(x) >= 6 ? 4 : 3; pole(x, -5, h); pole(x, 5, h); }
    for (var z = -2.5; z <= 2.5; z += 2.5) { pole(-10, z, 4); pole(10, z, 4); }

    // Focos de techo (emisivos) + haces de luz
    var lampMat = new T.MeshBasicMaterial({ color: 0xffffff });
    var beamMat = new T.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.032, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
    [[-6, -3], [-6, 3], [0, -3], [0, 3], [6, -3], [6, 3]].forEach(function (p) {
      var l = new T.Mesh(new T.BoxGeometry(1.4, 0.06, 0.35), lampMat); l.position.set(p[0], 8, p[1]); scene.add(l);
      var b = new T.Mesh(new T.ConeGeometry(2.6, 8, 24, 1, true), beamMat); b.position.set(p[0], 4, p[1]); scene.add(b);
    });

    // Partículas de polvo
    var pc = isMobile ? 220 : 500, pos = new Float32Array(pc * 3);
    for (var i = 0; i < pc; i++) { pos[i * 3] = (Math.random() - 0.5) * 24; pos[i * 3 + 1] = Math.random() * 8; pos[i * 3 + 2] = (Math.random() - 0.5) * 14; }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var dust = new T.Points(pg, new T.PointsMaterial({ color: 0xffd9b0, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(dust);

    // Bola + estela + sombra
    var ballMat = new T.MeshStandardMaterial({ color: 0xdfff3d, emissive: 0x6f8a00, emissiveIntensity: 0.55, roughness: 0.6 });
    var ball = new T.Mesh(new T.SphereGeometry(0.14, 24, 24), ballMat); scene.add(ball);
    var ballLight = new T.PointLight(0xdfff3d, 0.9, 4, 2); scene.add(ballLight);
    var trail = [];
    for (var k = 0; k < 14; k++) {
      var tm = new T.Mesh(new T.SphereGeometry(0.12 * (1 - k / 16), 12, 12), new T.MeshBasicMaterial({ color: 0xdfff3d, transparent: true, opacity: 0.35 * (1 - k / 14), depthWrite: false }));
      scene.add(tm); trail.push(tm);
    }
    var shadowTex = canvasTex(64, function (g, s) {
      var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    });
    var shadow = new T.Mesh(new T.PlaneGeometry(0.7, 0.7), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; scene.add(shadow);

    // Recorrido de un punto (golpe → bote → cristal → golpe…)
    var path = [
      { p: [-8.5, 1.0, -2.6], h: 2.4 }, { p: [4.8, 0.14, 1.6], h: 0.9 }, { p: [9.8, 1.4, 3.0], h: 0.25 },
      { p: [7.6, 1.1, 2.2], h: 2.6 }, { p: [-5.2, 0.14, -1.2], h: 0.9 }, { p: [-9.8, 1.6, -3.4], h: 0.3 }
    ];
    var segT = path.map(function (s, i) {
      var n = path[(i + 1) % path.length].p; var dx = n[0] - s.p[0], dz = n[2] - s.p[2];
      return Math.max(0.35, Math.sqrt(dx * dx + dz * dz) / 13);
    });
    var total = segT.reduce(function (a, b) { return a + b; }, 0);
    function ballAt(time, out) {
      var t = time % total, i = 0;
      while (t > segT[i]) { t -= segT[i]; i++; }
      var u = t / segT[i], a = path[i].p, b = path[(i + 1) % path.length].p, h = path[i].h;
      out.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + h * 4 * u * (1 - u), lerp(a[2], b[2], u));
      return out;
    }

    // Cámara: plano general → dentro de pista con el scroll
    var camA = { p: new T.Vector3(-15, 9.5, 15), l: new T.Vector3(-5.5, 0, 3.5) };
    var camB = { p: new T.Vector3(-9.3, 1.75, 1.8), l: new T.Vector3(3, 1.0, -0.8) };
    if (isMobile) { camA.p.set(-12, 16, 17); camA.l.set(0, 0, 0); }
    var progress = 0, eased = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
    W.setCourtProgress = function (p) { progress = Math.max(0, Math.min(1, p)); };
    window.addEventListener('pointermove', function (e) {
      tmx = e.clientX / window.innerWidth - 0.5; tmy = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.fov = w / h < 1 ? 58 : 42; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    var running = true, clock = new T.Clock(), elapsed = 0, history = [], tmp = new T.Vector3(), look = new T.Vector3();
    onVisible(canvas, function (v) { var was = running; running = v; if (v && !was) { clock.getDelta(); loop(); } });

    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      var dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
      eased += (progress - eased) * 0.08;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      var e = eased * eased * (3 - 2 * eased);
      camera.position.lerpVectors(camA.p, camB.p, e);
      camera.position.x += Math.sin(elapsed * 0.15) * 0.6 * (1 - e) + mx * 1.4;
      camera.position.y += -my * 0.8;
      camera.position.z += mx * -0.8;
      look.lerpVectors(camA.l, camB.l, e);
      camera.lookAt(look);

      ballAt(elapsed, tmp);
      ball.position.copy(tmp); ballLight.position.copy(tmp);
      ball.rotation.x += dt * 12; ball.rotation.z += dt * 7;
      shadow.position.x = tmp.x; shadow.position.z = tmp.z;
      var sc = 1 / (1 + tmp.y * 0.5); shadow.scale.set(sc, sc, sc); shadow.material.opacity = sc;
      history.unshift(tmp.clone()); if (history.length > 30) history.pop();
      for (var j = 0; j < trail.length; j++) { var hp = history[Math.min(history.length - 1, j * 2 + 1)]; if (hp) trail[j].position.copy(hp); }

      dust.rotation.y = elapsed * 0.01;
      var arr = dust.geometry.attributes.position.array;
      for (var q = 1; q < arr.length; q += 3) { arr[q] += 0.003; if (arr[q] > 8) arr[q] = 0; }
      dust.geometry.attributes.position.needsUpdate = true;
      warm.intensity = 2 + Math.sin(elapsed * 1.3) * 0.3;

      renderer.render(scene, camera);
    }
    loop();
    canvas.classList.add('is-ready');
  };

  /* =========================================================
     2. PALA DE PÁDEL 3D (reserva)
     ========================================================= */
  W.initRacket = function () {
    var canvas = document.getElementById('racket3d');
    if (!canvas) return;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0.2, 9.6);

    scene.add(new T.AmbientLight(0xffffff, 0.35));
    var k1 = new T.DirectionalLight(0xffffff, 1.4); k1.position.set(3, 4, 6); scene.add(k1);
    var k2 = new T.PointLight(0xff5a2a, 3, 20); k2.position.set(-4, 1, 3); scene.add(k2);
    var k3 = new T.PointLight(0x4f8bff, 2.5, 20); k3.position.set(4, -2, -4); scene.add(k3);

    // Forma de la cabeza
    var s = new T.Shape();
    s.moveTo(-0.24, 0);
    s.lineTo(-0.24, 0.55);
    s.bezierCurveTo(-0.5, 0.9, -1.32, 1.35, -1.32, 2.45);
    s.bezierCurveTo(-1.32, 3.45, -0.8, 4.0, 0, 4.0);
    s.bezierCurveTo(0.8, 4.0, 1.32, 3.45, 1.32, 2.45);
    s.bezierCurveTo(1.32, 1.35, 0.5, 0.9, 0.24, 0.55);
    s.lineTo(0.24, 0); s.lineTo(-0.24, 0);
    // Agujeros
    for (var y = 1.75; y <= 3.6; y += 0.27) {
      for (var x = -1.0; x <= 1.0; x += 0.27) {
        var ox = x + ((Math.round(y / 0.27) % 2) ? 0.135 : 0);
        if ((ox * ox) / (0.95 * 0.95) + ((y - 2.65) * (y - 2.65)) / (1.05 * 1.05) < 1) {
          var hPath = new T.Path(); hPath.absarc(ox, y, 0.065, 0, Math.PI * 2, true); s.holes.push(hPath);
        }
      }
    }
    var throat = new T.Path(); throat.absellipse(0, 1.15, 0.26, 0.36, 0, Math.PI * 2, true); s.holes.push(throat);

    var geo = new T.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 40 });
    geo.translate(0, -2.0, -0.16);

    var face = canvasTex(1024, function (g, S) {
      g.fillStyle = '#0c0e13'; g.fillRect(0, 0, S, S);
      // carbono
      for (var i = 0; i < S; i += 8) for (var j = 0; j < S; j += 8) {
        g.fillStyle = ((i + j) / 8) % 2 ? '#14171e' : '#0e1016'; g.fillRect(i, j, 8, 8);
      }
      var gr = g.createLinearGradient(0, S, S, 0);
      gr.addColorStop(0, '#ff1f4b'); gr.addColorStop(1, '#ff7a1a');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, S * 0.78); g.lineTo(S, S * 0.38); g.lineTo(S, S * 0.52); g.lineTo(0, S * 0.92); g.fill();
      g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(0, S * 0.66); g.lineTo(S, S * 0.3); g.lineTo(S, S * 0.33); g.lineTo(0, S * 0.69); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = '#f3f1ea'; g.font = 'italic 900 150px Archivo, Arial Black, sans-serif'; g.textAlign = 'center';
      g.save(); g.translate(S / 2, S * 0.36); g.fillText('WILD', 0, 0); g.restore();
      g.fillStyle = '#dfff3d'; g.font = '700 34px JetBrains Mono, monospace'; g.fillText('INDOOR · DOS HERMANAS', S / 2, S * 0.43);
    });
    face.encoding = T.sRGBEncoding;
    // Mapear UV: bbox de la forma x[-1.32,1.32] y[0,4]
    face.repeat.set(1 / 2.7, 1 / 4.1); face.offset.set(1.35 / 2.7, 0.05 / 4.1);
    face.wrapS = face.wrapT = T.ClampToEdgeWrapping;
    var headMat = new T.MeshStandardMaterial({ map: face, roughness: 0.35, metalness: 0.4 });
    var rimMat = new T.MeshStandardMaterial({ color: 0x111318, roughness: 0.3, metalness: 0.8 });
    var head = new T.Mesh(geo, [headMat, rimMat]);

    var handle = new T.Mesh(new T.CylinderGeometry(0.2, 0.22, 1.7, 24), new T.MeshStandardMaterial({ color: 0x15171c, roughness: 0.9 }));
    handle.position.y = -2.85;
    var cap = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 0.12, 24), new T.MeshStandardMaterial({ color: 0xff4a30, roughness: 0.4, metalness: 0.5 }));
    cap.position.y = -3.72;
    var grips = new T.Group();
    for (var r = 0; r < 5; r++) {
      var ring = new T.Mesh(new T.TorusGeometry(0.218, 0.014, 8, 32), new T.MeshStandardMaterial({ color: 0xff4a30, roughness: 0.5 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = -2.3 - r * 0.28; grips.add(ring);
    }
    var racket = new T.Group(); racket.add(head, handle, cap, grips);
    racket.rotation.z = -0.35; racket.position.x = -0.3;
    scene.add(racket);

    var ball = new T.Mesh(new T.SphereGeometry(0.42, 32, 32), new T.MeshStandardMaterial({ color: 0xdfff3d, emissive: 0x4a5c00, emissiveIntensity: 0.4, roughness: 0.75 }));
    scene.add(ball);

    // Interacción: arrastrar
    var rotY = 0.6, rotX = 0, velY = 0.004, drag = false, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      velY = (e.clientX - lx) * 0.006; rotX += (e.clientY - ly) * 0.004; rotX = Math.max(-0.6, Math.min(0.6, rotX));
      lx = e.clientX; ly = e.clientY;
    });
    function up() { drag = false; }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize); resize();

    var running = false, clock = new T.Clock(), t = 0;
    onVisible(canvas, function (v) { var was = running; running = v; if (v && !was) { clock.getDelta(); loop(); } });
    function loop() {
      if (!running) return;
      requestAnimationFrame(loop);
      var dt = Math.min(clock.getDelta(), 0.05); t += dt;
      if (!drag) velY += (0.006 - velY) * 0.03;
      rotY += velY;
      racket.rotation.y = rotY; racket.rotation.x = rotX * 0.9 + Math.sin(t * 0.8) * 0.05;
      racket.position.y = Math.sin(t * 1.1) * 0.12;
      var b = Math.abs(Math.sin(t * 2.2));
      ball.position.set(1.85, -2.7 + b * 2.6, 1.0);
      ball.scale.set(1 + (1 - b) * 0.08, 1 - (1 - b) * 0.1, 1 + (1 - b) * 0.08);
      ball.rotation.x += dt * 2;
      renderer.render(scene, camera);
    }
  };
})();
