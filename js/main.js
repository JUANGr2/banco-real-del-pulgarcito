/* =====================================================================
   Banco Real del Pulgarcito: interacciones y animaciones
   Librerías: GSAP 3.13 (ScrollTrigger, SplitText) y Lenis 1.3.
   Todo el contenido se ve sin JavaScript; aquí solo se le da vida.
   ===================================================================== */
(() => {
  'use strict';

  const d = document;
  const raiz = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hayGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' && typeof window.SplitText !== 'undefined';
  const animar = hayGsap && !reducir;
  const dinero = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dineroEntero = (n) => '$' + Math.round(n).toLocaleString('en-US');
  let lenis = null;

  const refrescar = (() => {
    let t;
    return () => {
      if (!hayGsap) return;
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 120);
    };
  })();

  /* ------------------------------------------------------------------
     Menú de teléfono y anclas
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const botonMenu = $('.nav__menu');
  const menu = $('#menu');

  function abrirMenu(abierto) {
    botonMenu.setAttribute('aria-expanded', String(abierto));
    $('.nav__menu-texto').textContent = abierto ? 'Cerrar' : 'Menú';
    menu.hidden = !abierto;
    raiz.classList.toggle('menu-abierto', abierto);
    if (lenis) abierto ? lenis.stop() : lenis.start();
    if (abierto) {
      nav.classList.remove('oculta');
      if (animar) gsap.from($$('a', menu), { y: 28, opacity: 0, duration: 0.55, stagger: 0.035, ease: 'power3.out' });
    }
  }

  botonMenu.addEventListener('click', () => abrirMenu(botonMenu.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      abrirMenu(false);
      botonMenu.focus();
    }
  });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const destino = id && d.getElementById(id);
      if (!destino) return;
      e.preventDefault();
      if (!menu.hidden) abrirMenu(false);
      const alto = id === 'inicio' ? 0 : nav.offsetHeight - 1;
      if (lenis) {
        lenis.scrollTo(destino, { offset: -alto, duration: 1.4 });
      } else {
        const y = destino.getBoundingClientRect().top + window.scrollY - alto;
        window.scrollTo({ top: y, behavior: reducir ? 'auto' : 'smooth' });
      }
      destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------------
     Soluciones: pestañas por perfil
     ------------------------------------------------------------------ */
  function iniciarPestanas() {
    const pestanas = $$('.pestana');
    const paneles = pestanas.map((p) => d.getElementById(p.getAttribute('aria-controls')));
    const fotos = $$('.soluciones__foto');
    const contenedor = $('.soluciones__paneles');
    let actual = 0;

    // Igualar la altura de los paneles para que la página no salte al cambiar
    const medir = () => {
      contenedor.style.minHeight = '';
      const alturas = paneles.map((p) => {
        const oculto = p.hidden;
        p.hidden = false;
        const h = p.offsetHeight;
        p.hidden = oculto;
        return h;
      });
      contenedor.style.minHeight = Math.max(...alturas) + 'px';
    };

    paneles.forEach((p, i) => { p.hidden = i !== 0; });
    medir();
    window.addEventListener('resize', medir);
    if (d.fonts) d.fonts.ready.then(medir);

    function activar(i, enfocar) {
      if (i === actual) return;
      const anterior = actual;
      actual = i;
      pestanas.forEach((p, j) => {
        p.setAttribute('aria-selected', String(i === j));
        p.tabIndex = i === j ? 0 : -1;
        paneles[j].hidden = i !== j;
      });
      if (enfocar) pestanas[i].focus();

      const perfil = pestanas[i].id.replace('tab-', '');
      const nueva = fotos.find((f) => f.dataset.perfil === perfil);
      const vieja = fotos.find((f) => f.dataset.perfil === pestanas[anterior].id.replace('tab-', ''));

      if (animar) {
        gsap.set(nueva, { zIndex: 2 });
        gsap.set(vieja, { zIndex: 1 });
        nueva.classList.add('es-activa');
        gsap.fromTo(nueva, { clipPath: 'inset(100% 0% 0% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut',
          onComplete: () => { vieja.classList.remove('es-activa'); gsap.set([nueva, vieja], { clearProps: 'zIndex' }); },
        });
        gsap.fromTo($('img', nueva), { scale: 1.25 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
        gsap.fromTo($$('li', paneles[i]), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' });
      } else {
        fotos.forEach((f) => f.classList.toggle('es-activa', f === nueva));
      }
    }

    pestanas.forEach((p, i) => {
      p.addEventListener('click', () => activar(i));
      p.addEventListener('keydown', (e) => {
        const teclas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (e.key in teclas) {
          e.preventDefault();
          activar((actual + teclas[e.key] + pestanas.length) % pestanas.length, true);
        } else if (e.key === 'Home') {
          e.preventDefault(); activar(0, true);
        } else if (e.key === 'End') {
          e.preventDefault(); activar(pestanas.length - 1, true);
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Tarjetas: niveles e inclinación 3D
     ------------------------------------------------------------------ */
  const NIVELES = {
    clasica: {
      nombre: 'Clásica',
      lema: 'Para tus compras de todos los días, sin complicaciones.',
      lista: ['Puntos Real en cada compra', 'Compras en cuotas en comercios afiliados', 'Alertas por SMS y correo electrónico', 'Seguro antifraude opcional'],
    },
    oro: {
      nombre: 'Oro',
      lema: 'Beneficios superiores y más puntos en días especiales.',
      lista: ['Doble Puntos Real en fechas especiales', 'Extrafinanciamiento sobre tu límite', 'Asistencia en viajes', 'Cuotas sin intereses en comercios afiliados'],
    },
    platino: {
      nombre: 'Platino',
      lema: 'Flexibilidad para tu día a día y para tus viajes.',
      lista: ['Acumula millas o Puntos Real', 'Seguro de viaje y de compras', 'Asistencia las 24 horas en el exterior', 'Promociones exclusivas'],
    },
    corona: {
      nombre: 'Corona',
      lema: 'Privilegios para un estilo de vida exigente.',
      lista: ['Acceso a salas VIP en aeropuertos', 'Concierge personal las 24 horas', 'Seguros premium de viaje y compras', 'Atención de Banca Preferencial'],
    },
  };

  function iniciarTarjetas() {
    const botones = $$('.nivel');
    const tarjeta = $('.tarjeta');
    const cara = $('.tarjeta__cara');
    const nombre = $('.tarjeta__nivel');
    const lema = $('[data-texto="lema"]');
    const lista = $('[data-texto="lista"]');
    let actual = 'clasica';

    function pintar(clave) {
      const datos = NIVELES[clave];
      tarjeta.dataset.nivel = clave;
      nombre.textContent = datos.nombre;
      lema.textContent = datos.lema;
      lista.innerHTML = datos.lista.map((t) => `<li>${t}</li>`).join('');
    }

    function elegir(clave, enfocar) {
      if (clave === actual) return;
      actual = clave;
      botones.forEach((b) => {
        const si = b.dataset.nivel === clave;
        b.setAttribute('aria-checked', String(si));
        b.tabIndex = si ? 0 : -1;
        if (si && enfocar) b.focus();
      });
      if (animar) {
        gsap.timeline()
          .to(cara, { rotationY: 90, duration: 0.26, ease: 'power2.in' })
          .add(() => pintar(clave))
          .fromTo(cara, { rotationY: -90 }, { rotationY: 0, duration: 0.6, ease: 'back.out(1.5)' })
          .fromTo([lema, ...lista.children], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out' }, '<');
      } else {
        pintar(clave);
      }
    }

    botones.forEach((b, i) => {
      b.addEventListener('click', () => elegir(b.dataset.nivel));
      b.addEventListener('keydown', (e) => {
        const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!paso) return;
        e.preventDefault();
        elegir(botones[(i + paso + botones.length) % botones.length].dataset.nivel, true);
      });
    });

    if (animar && punteroFino) {
      const escena = $('.tarjetas__escena');
      const rotX = gsap.quickTo(tarjeta, 'rotationX', { duration: 0.6, ease: 'power3' });
      const rotY = gsap.quickTo(tarjeta, 'rotationY', { duration: 0.6, ease: 'power3' });
      escena.addEventListener('pointermove', (e) => {
        const r = escena.getBoundingClientRect();
        rotY(((e.clientX - r.left) / r.width - 0.5) * 22);
        rotX(-((e.clientY - r.top) / r.height - 0.5) * 18);
      });
      escena.addEventListener('pointerleave', () => { rotX(0); rotY(0); });
    }
  }

  /* ------------------------------------------------------------------
     Simulador de cuota (sistema francés, cuota fija)
     ------------------------------------------------------------------ */
  const CREDITOS = {
    personal: { monto: [500, 40000, 250, 8000], plazo: [6, 96, 6, 48], tasa: 15.5 },
    vivienda: { monto: [10000, 300000, 1000, 75000], plazo: [60, 300, 12, 240], tasa: 8.75 },
    vehiculo: { monto: [5000, 80000, 500, 22000], plazo: [12, 96, 6, 72], tasa: 10.5 },
    estudios: { monto: [1000, 50000, 500, 12000], plazo: [12, 120, 6, 60], tasa: 11 },
  };

  function iniciarSimulador() {
    const form = $('#simulador');
    const monto = $('#sim-monto');
    const plazo = $('#sim-plazo');
    const tasa = $('#sim-tasa');
    const salida = {
      monto: $('#sim-monto-valor'), plazo: $('#sim-plazo-valor'), tasa: $('#sim-tasa-valor'),
      cuota: $('#sim-cuota'), capital: $('#sim-capital'), intereses: $('#sim-intereses'),
      total: $('#sim-total'), barra: $('#sim-barra'),
    };
    const mostrado = { cuota: 224.68, intereses: 2784.59, total: 10784.59 };

    function textoPlazo(n) {
      if (n % 12 !== 0) return `${n} meses`;
      const anios = n / 12;
      return `${n} meses (${anios} ${anios === 1 ? 'año' : 'años'})`;
    }

    function calcular() {
      const P = Number(monto.value);
      const n = Number(plazo.value);
      const t = Number(tasa.value);
      const r = t / 1200;
      const cuota = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
      const total = cuota * n;
      const intereses = total - P;

      salida.monto.textContent = dineroEntero(P);
      salida.plazo.textContent = textoPlazo(n);
      salida.tasa.textContent = t.toFixed(2) + ' %';
      salida.capital.textContent = dinero(P);
      salida.barra.style.width = ((P / total) * 100).toFixed(1) + '%';

      const destino = { cuota, intereses, total };
      if (animar) {
        gsap.to(mostrado, {
          ...destino, duration: 0.5, ease: 'power2.out', overwrite: true,
          onUpdate: () => {
            salida.cuota.textContent = dinero(mostrado.cuota);
            salida.intereses.textContent = dinero(mostrado.intereses);
            salida.total.textContent = dinero(mostrado.total);
          },
        });
      } else {
        Object.assign(mostrado, destino);
        salida.cuota.textContent = dinero(cuota);
        salida.intereses.textContent = dinero(intereses);
        salida.total.textContent = dinero(total);
      }
    }

    function cambiarTipo(tipo) {
      const c = CREDITOS[tipo];
      [monto.min, monto.max, monto.step, monto.value] = c.monto.map(String);
      [plazo.min, plazo.max, plazo.step, plazo.value] = c.plazo.map(String);
      tasa.value = String(c.tasa);
      calcular();
    }

    $$('input[name="sim-tipo"]', form).forEach((r) => r.addEventListener('change', () => cambiarTipo(r.value)));
    [monto, plazo, tasa].forEach((i) => i.addEventListener('input', calcular));
    form.addEventListener('submit', (e) => e.preventDefault());
    calcular();
  }

  /* ------------------------------------------------------------------
     Conversor de divisas (valores de ejemplo: [compra, venta])
     ------------------------------------------------------------------ */
  const TASAS = {
    EUR: [1.0829, 1.1534], GBP: [1.3014, 1.3824], CAD: [0.6805, 0.7425], MXN: [0.0514, 0.0562],
    GTQ: [0.1256, 0.1405], CHF: [1.1794, 1.2494], JPY: [0.006, 0.0066], CNY: [0.1349, 0.1649],
  };

  function iniciarConversor() {
    const form = $('#conversor');
    const monto = $('#conv-monto');
    const moneda = $('#conv-moneda');
    const etiqueta = $('#conv-etiqueta');
    const resultado = $('#conv-resultado');
    const invertir = $('#conv-invertir');
    const filas = $$('.tabla tbody tr');
    const codigos = Object.keys(TASAS);
    let vendo = false;

    function calcular() {
      const cantidad = Math.max(0, Number(monto.value) || 0);
      const [compra, venta] = TASAS[moneda.value];
      if (vendo) {
        resultado.textContent = dinero(cantidad * compra);
      } else {
        resultado.textContent = (cantidad / venta).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + moneda.value;
      }
      filas.forEach((f, i) => f.classList.toggle('es-elegida', codigos[i] === moneda.value));
    }

    invertir.addEventListener('click', () => {
      vendo = !vendo;
      invertir.classList.toggle('girado', vendo);
      etiqueta.textContent = vendo ? 'Tengo divisas' : 'Tengo dólares';
      $('label[for="conv-moneda"]').textContent = vendo ? 'De la moneda' : 'Quiero';
      calcular();
    });
    monto.addEventListener('input', calcular);
    moneda.addEventListener('change', calcular);
    form.addEventListener('submit', (e) => e.preventDefault());
    calcular();
  }

  /* ------------------------------------------------------------------
     Preguntas frecuentes (acordeón)
     ------------------------------------------------------------------ */
  function iniciarAcordeon() {
    $$('.pregunta button').forEach((boton) => {
      const panel = d.getElementById(boton.getAttribute('aria-controls'));
      panel.hidden = true;
      boton.addEventListener('click', () => {
        const abrir = boton.getAttribute('aria-expanded') !== 'true';
        boton.setAttribute('aria-expanded', String(abrir));
        if (!animar) {
          panel.hidden = !abrir;
          return;
        }
        if (abrir) {
          panel.hidden = false;
          gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.5, ease: 'power3.out', onComplete: refrescar });
        } else {
          gsap.to(panel, { height: 0, duration: 0.4, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height' }); refrescar(); } });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     App: pantallas del teléfono
     ------------------------------------------------------------------ */
  const pasos = $$('.paso');
  const vistas = $$('.vista');
  function mostrarPantalla(i) {
    pasos.forEach((p, j) => p.classList.toggle('es-activo', i === j));
    vistas.forEach((v, j) => v.classList.toggle('es-activa', i === j));
  }
  pasos.forEach((p, i) => $('button', p).addEventListener('click', () => mostrarPantalla(i)));

  iniciarPestanas();
  iniciarTarjetas();
  iniciarSimulador();
  iniciarConversor();
  iniciarAcordeon();

  /* ------------------------------------------------------------------
     Sin animación (GSAP no cargó o el sistema pide menos movimiento)
     ------------------------------------------------------------------ */
  if (!animar) {
    raiz.classList.remove('js-espera');
    return;
  }

  /* ==================================================================
     ANIMACIÓN
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const tarde = performance.now() > 2000; // si todo tardó, no repetir el telón
  const fuentes = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);

  fuentes.then(() => {
    raiz.classList.add('motion');
    const intro = $('.intro');
    if (!tarde && window.scrollY < 10) intro.classList.add('activa');
    raiz.classList.remove('js-espera');

    construirPortada();
    construirRevelados();
    construirCuentas();
    construirTarjetas();
    construirCrecer();
    construirExterior();
    construirPyme();
    construirEmpresas();
    construirApp();
    construirEmblema();
    construirContacto();
    construirPie();
    construirNav();
    construirCursor();

    entrada(intro);
    if (d.readyState === 'complete') ScrollTrigger.refresh();
    else window.addEventListener('load', () => ScrollTrigger.refresh());
  });

  /* ---------- Telón y entrada de la portada ---------- */
  function entrada(intro) {
    const chars = SplitText.create('.portada__palabras, .portada__linea--b', { type: 'chars', charsClass: 'letra' }).chars;
    const foto = $('.portada__foto');
    const bloques = $$('.portada__texto > *, .portada__tareas > *');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    gsap.set(chars, { yPercent: 70, opacity: 0, rotate: 4 });
    gsap.set(foto, { scale: 0, transformOrigin: '0% 60%' });
    gsap.set(bloques, { y: 26, opacity: 0 });

    if (intro.classList.contains('activa')) {
      if (lenis) lenis.stop();
      tl.fromTo('.intro__emblema', { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' })
        .to('.intro__emblema', { opacity: 0, y: -30, duration: 0.45, ease: 'power2.in' }, '+=0.15')
        .to(intro, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.2')
        .add(() => { intro.classList.remove('activa'); gsap.set(intro, { clearProps: 'all' }); if (lenis) lenis.start(); });
    }
    tl.to(chars, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.1, stagger: 0.028 }, intro.classList.contains('activa') ? '-=0.55' : 0)
      .to(foto, { scale: 1, duration: 1.1, ease: 'expo.out' }, '<0.25')
      .to(bloques, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, '<0.2')
      .add(() => gsap.set(foto, { clearProps: 'transform' }));
  }

  /* ---------- Portada: la foto sale del pulgar y llena la pantalla ---------- */
  function construirPortada() {
    const escena = $('.portada__escena');
    const foto = $('.portada__foto');
    const pulgar = $('.portada__pulgar');

    const caja = () => {
      let x = 0;
      let y = 0;
      let el = pulgar;
      while (el && el !== escena) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
      }
      return { x, y, w: pulgar.offsetWidth, h: pulgar.offsetHeight };
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: escena,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (window.innerWidth < 900 ? 1.1 : 1.6)),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        refreshPriority: 1,
      },
    });

    tl.fromTo(foto,
      { top: () => caja().y, left: () => caja().x, width: () => caja().w, height: () => caja().h },
      { top: 0, left: 0, width: () => escena.clientWidth, height: () => escena.clientHeight, ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo($('img', foto), { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .to('.portada__linea--a', { xPercent: -14, opacity: 0, ease: 'power2.in', duration: 0.55 }, 0)
      .to('.portada__linea--b', { xPercent: 14, opacity: 0, ease: 'power2.in', duration: 0.55 }, 0)
      .to(['.portada__texto', '.portada__tareas'], { y: 70, opacity: 0, ease: 'power2.in', duration: 0.45 }, 0)
      .fromTo('.portada__leyenda', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.78)
      .fromTo('.portada__leyenda > *', { y: 30 }, { y: 0, duration: 0.3, stagger: 0.05 }, 0.78)
      .to({}, { duration: 0.25 });
  }

  /* ---------- Entradas de títulos, textos y listas ---------- */
  function construirRevelados() {
    $$('.titulo-l').forEach((titulo) => {
      if (titulo.closest('.emblema__texto') || titulo.closest('.pyme__titular') || titulo.closest('.pieza--titulo')) return;
      SplitText.create(titulo, {
        type: 'lines', mask: 'lines', linesClass: 'linea', autoSplit: true,
        onSplit: (s) => gsap.from(s.lines, {
          yPercent: 105, duration: 1.1, stagger: 0.09, ease: 'power4.out',
          scrollTrigger: { trigger: titulo, start: 'top 86%', once: true },
        }),
      });
    });

    const sueltos = $$('.cabecera .entrada, .tarjetas__texto > .entrada, .exterior__texto > .entrada, .app__texto > .entrada, .requisitos, .divisas, .tarjetas__extra, .simulador, .aprende, .ayuda__preguntas > .titulo-m');
    sueltos.forEach((el) => gsap.from(el, {
      y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    }));

    const grupos = ['.productos', '.filas', '.creditos__lista', '.servicios', '.definiciones', '.consejos', '.acordeon', '.canales', '.pie__columnas', '.niveles', '.beneficios'];
    grupos.forEach((sel) => $$(sel).forEach((lista) => {
      const hijos = Array.from(lista.children);
      gsap.from(hijos, {
        y: 28, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
      });
    }));

    // Foto de Soluciones: se abre de abajo hacia arriba al entrar
    gsap.fromTo('.soluciones__fotos', { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.soluciones__fotos', start: 'top 85%', once: true },
    });
    gsap.from('.pestana', { x: -20, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.pestanas', start: 'top 85%', once: true } });
  }

  /* ---------- Cuentas: la foto crece desde el centro ---------- */
  function construirCuentas() {
    const marco = $('.expande__marco');
    gsap.matchMedia().add({ ancho: '(min-width: 900px)', angosto: '(max-width: 899px)' }, (ctx) => {
      const inicio = ctx.conditions.ancho ? 'inset(22% 38% 22% 38%)' : 'inset(16% 26% 16% 26%)';
      gsap.timeline({ scrollTrigger: { trigger: marco, start: 'top 95%', end: 'center 45%', scrub: 1 } })
        .fromTo(marco, { clipPath: inicio }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
        .fromTo($('img', marco), { scale: 1.45 }, { scale: 1, ease: 'none' }, 0);
    });
  }

  /* ---------- Tarjetas ---------- */
  function construirTarjetas() {
    gsap.from('.tarjeta', {
      rotationY: -38, rotationX: 22, y: 90, opacity: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.tarjetas__escena', start: 'top 80%', once: true },
    });
    gsap.to('.tarjetas__escena', { y: -12, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* ---------- Inversiones y seguros: recorrido horizontal ---------- */
  function construirCrecer() {
    const fijo = $('.crecer__fijo');
    const pista = $('.crecer__pista');
    gsap.matchMedia().add({ ancho: '(min-width: 900px)', angosto: '(max-width: 899px)' }, (ctx) => {
      if (ctx.conditions.angosto) {
        $$('.pieza__foto').forEach((f) => {
          gsap.timeline({ scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 35%', scrub: 1 } })
            .fromTo(f, { clipPath: 'inset(14% 18% 14% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
            .fromTo($('img', f), { scale: 1.35 }, { scale: 1, ease: 'none' }, 0);
        });
        gsap.from('.pieza--titulo > *', { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.pieza--titulo', start: 'top 85%', once: true } });
        return;
      }
      const distancia = () => Math.max(0, pista.scrollWidth - window.innerWidth);
      const viaje = gsap.to(pista, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: { trigger: fijo, start: 'top top', end: () => '+=' + distancia(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1 },
      });
      $$('.pieza__foto').forEach((f) => {
        gsap.fromTo(f, { clipPath: 'inset(16% 22% 16% 22%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
          scrollTrigger: { trigger: f, containerAnimation: viaje, start: 'left 100%', end: 'left 40%', scrub: true },
        });
        gsap.fromTo($('img', f), { scale: 1.4, xPercent: -6 }, {
          scale: 1.05, xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: f, containerAnimation: viaje, start: 'left 100%', end: 'right 0%', scrub: true },
        });
      });
      gsap.from('.pieza--titulo > *', { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: fijo, start: 'top 70%', once: true } });
    });
  }

  /* ---------- Exterior: foto fija que respira ---------- */
  function construirExterior() {
    const marco = $('.exterior__marco');
    gsap.fromTo(marco, { clipPath: 'inset(0% 0% 100% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: '.exterior', start: 'top 70%', once: true },
    });
    gsap.fromTo($('img', marco), { scale: 1.3 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.exterior', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }

  /* ---------- Pyme: de ventana pequeña a pantalla completa ---------- */
  function construirPyme() {
    const escena = $('.pyme__escena');
    const foto = $('.pyme__foto');
    gsap.matchMedia().add({ ancho: '(min-width: 900px)', angosto: '(max-width: 899px)' }, (ctx) => {
      const inicio = ctx.conditions.ancho ? 'inset(16% 7% 30% 60%)' : 'inset(14% 8% 52% 8%)';
      gsap.timeline({
        scrollTrigger: { trigger: escena, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 1.3), pin: true, scrub: 1, anticipatePin: 1, refreshPriority: 1 },
      })
        .fromTo(foto, { clipPath: inicio }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo($('img', foto), { scale: 1.35 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .to('.pyme__velo', { opacity: 1, duration: 0.4 }, 0.5)
        .to({}, { duration: 0.2 });
    });
    gsap.from('.pyme__titular > *', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: escena, start: 'top 70%', once: true } });
  }

  /* ---------- Empresas: foto de archivo que se abre ---------- */
  function construirEmpresas() {
    const marco = $('.archivo__marco');
    gsap.timeline({ scrollTrigger: { trigger: marco, start: 'top 95%', end: 'center 45%', scrub: 1 } })
      .fromTo(marco, { clipPath: 'inset(0% 30% 0% 30%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
      .fromTo($('img', marco), { scale: 1.3 }, { scale: 1, ease: 'none' }, 0);
  }

  /* ---------- App: la pantalla cambia con cada paso ---------- */
  function construirApp() {
    gsap.from('.telefono', { y: 100, rotate: -4, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.app', start: 'top 70%', once: true } });
    gsap.matchMedia().add('(min-width: 900px)', () => {
      pasos.forEach((paso, i) => ScrollTrigger.create({
        trigger: paso, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) mostrarPantalla(i); },
      }));
    });
  }

  /* ---------- Emblema: recorrido con zoom por el logo ---------- */
  function construirEmblema() {
    const escena = $('.emblema__escena');
    const img = $('.emblema__marco img');
    const textos = $$('.emblema__texto');
    // [centro x, centro y, escala] en fracciones del logo
    const focos = [[0.5, 0.5, 1], [0.5, 0.125, 2.6], [0.51, 0.335, 1.85], [0.497, 0.452, 2.9], [0.483, 0.512, 4], [0.5, 0.47, 1.6], [0.5, 0.5, 1]];
    const pose = ([x, y, s]) => ({ xPercent: 100 * (0.5 - s * x), yPercent: 100 * (0.5 - s * y), scale: s });

    gsap.set(img, { ...pose(focos[0]), transformOrigin: '0 0' });
    textos.forEach((t, i) => t.classList.toggle('es-activo', i === 0));
    gsap.set(textos.slice(1), { opacity: 0, visibility: 'hidden' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: escena, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 4), pin: true, scrub: 1, anticipatePin: 1, refreshPriority: 1 },
    });
    focos.slice(1).forEach((foco, k) => {
      const sale = textos[k % textos.length];
      const entra = textos[(k + 1) % textos.length];
      tl.to(img, { ...pose(foco), duration: 1, ease: 'power2.inOut' })
        .to(sale, { autoAlpha: 0, y: -24, duration: 0.35, ease: 'power2.in' }, '<')
        .fromTo(entra, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, '<0.45')
        .to({}, { duration: 0.35 });
    });
  }

  /* ---------- Contacto: el mapa se aleja al bajar ---------- */
  function construirContacto() {
    const marco = $('.mapa__marco');
    gsap.timeline({ scrollTrigger: { trigger: marco, start: 'top bottom', end: 'bottom 30%', scrub: 1 } })
      .fromTo(marco, { clipPath: 'inset(10% 12% 10% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
      .fromTo($('img', marco), { scale: 1.6 }, { scale: 1, ease: 'none' }, 0);
  }

  /* ---------- Pie: el nombre sube letra por letra ---------- */
  function construirPie() {
    const marca = $('.pie__marca');
    SplitText.create(marca, {
      type: 'chars', autoSplit: true,
      onSplit: (s) => gsap.from(s.chars, {
        yPercent: 60, opacity: 0, rotate: 6, duration: 1.2, stagger: 0.045, ease: 'power4.out',
        scrollTrigger: { trigger: marca, start: 'top 92%', once: true },
      }),
    });
    gsap.from('.pie__logo', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.pie', start: 'top 85%', once: true } });
  }

  /* ---------- Barra: se esconde al bajar y vuelve al subir ---------- */
  function construirNav() {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (!menu.hidden) return;
        nav.classList.toggle('oculta', self.direction === 1 && self.scroll() > 320);
      },
    });
  }

  /* ---------- Cursor y botones magnéticos (solo con ratón) ---------- */
  function construirCursor() {
    if (!punteroFino) return;
    const cursor = $('.cursor');
    const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      x(e.clientX);
      y(e.clientY);
      cursor.classList.add('visible');
    }, { passive: true });
    d.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('grande', Boolean(e.target.closest('a, button, label, select, input, .tarjetas__escena')));
    });
    d.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('visible'));

    $$('.boton').forEach((b) => {
      const bx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
      const by = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.22);
        by((e.clientY - r.top - r.height / 2) * 0.32);
      });
      b.addEventListener('pointerleave', () => { bx(0); by(0); });
    });
  }
})();
