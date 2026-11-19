/* Interacciones accesibles del tutorial, sin dependencias externas. */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const sidebar = $("sidebar");
  const menuButton = $("menuButton");
  const menuScrim = $("menuScrim");
  const searchInput = $("searchInput");
  const clearSearch = $("clearSearch");
  const searchStatus = $("searchStatus");
  const searchEmpty = $("searchEmpty");
  const searchResults = $("searchResults");
  const liveStatus = $("liveStatus");
  const progress = $("readingProgress");
  const progressBar = $("readingProgressBar");
  const backToTop = $("backToTop");

  document.body.classList.add("js-ready");

  /* ---------- Utilidades ---------- */
  const almacen = {
    leer(clave) {
      try {
        return localStorage.getItem(clave);
      } catch {
        return null;
      }
    },
    guardar(clave, valor) {
      try {
        localStorage.setItem(clave, valor);
        return true;
      } catch {
        return false;
      }
    }
  };

  let temporizadorAnuncio;
  function anunciar(mensaje) {
    liveStatus.textContent = "";
    clearTimeout(temporizadorAnuncio);
    temporizadorAnuncio = setTimeout(() => {
      liveStatus.textContent = mensaje;
    }, 60);
  }

  if (root.dataset.storageUnavailable === "true") {
    anunciar("El navegador no permitió leer tus preferencias guardadas. El tutorial sigue disponible.");
  }

  function guardarPreferencia(clave, valor, mensaje) {
    if (almacen.guardar(clave, valor)) {
      anunciar(mensaje);
    } else {
      anunciar(`${mensaje} No se pudo guardar tu preferencia en este navegador.`);
    }
  }

  function comportamientoDesplazamiento() {
    return reducedMotion.matches || root.classList.contains("eco") ? "auto" : "smooth";
  }

  /* ---------- Tema: claro, oscuro o automático ---------- */
  const botonesTema = [...document.querySelectorAll("[data-theme-choice]")];
  const mensajesTema = {
    light: "Tema claro activado.",
    dark: "Tema oscuro activado.",
    auto: "Tema automático: sigue la configuración de tu dispositivo."
  };
  const temaInicial = almacen.leer("tutorial-tema");
  let modoTema = ["light", "dark", "auto"].includes(temaInicial) ? temaInicial : "auto";

  function aplicarTema(modo, guardar = false) {
    modoTema = modo;
    const oscuro = modo === "dark" || (modo === "auto" && prefersDark.matches);
    root.dataset.theme = oscuro ? "dark" : "light";
    botonesTema.forEach((boton) => {
      boton.setAttribute("aria-pressed", String(boton.dataset.themeChoice === modo));
    });
    themeMeta?.setAttribute("content", oscuro ? "#0a1020" : "#f5f8ff");
    if (guardar) guardarPreferencia("tutorial-tema", modo, mensajesTema[modo]);
  }

  aplicarTema(modoTema);
  botonesTema.forEach((boton) => {
    boton.addEventListener("click", () => aplicarTema(boton.dataset.themeChoice, true));
  });
  prefersDark.addEventListener("change", () => {
    if (modoTema === "auto") aplicarTema("auto");
  });

  /* ---------- Modo eco ---------- */
  const ecoButton = $("ecoButton");
  const ecoGuardado = almacen.leer("tutorial-eco-visual");
  const ahorroDeDatos = navigator.connection?.saveData === true;

  function aplicarEco(activo, guardar = false) {
    root.classList.toggle("eco", activo);
    ecoButton.setAttribute("aria-pressed", String(activo));
    if (guardar) {
      guardarPreferencia(
        "tutorial-eco-visual",
        activo ? "on" : "off",
        activo
          ? "Modo eco activado: sin degradados, animaciones ni sombras."
          : "Modo eco desactivado."
      );
    }
  }

  aplicarEco(ecoGuardado ? ecoGuardado === "on" : ahorroDeDatos);
  ecoButton.addEventListener("click", () => {
    aplicarEco(!root.classList.contains("eco"), true);
  });

  /* ---------- Tamaño del texto ---------- */
  const tamanosTexto = [100, 112, 125];
  const textDown = $("textDown");
  const textUp = $("textUp");
  let nivelTexto = Number.parseInt(almacen.leer("tutorial-texto"), 10);
  if (!(nivelTexto >= 0 && nivelTexto < tamanosTexto.length)) nivelTexto = 0;

  function aplicarTexto(nivel, guardar = false) {
    nivelTexto = nivel;
    root.style.fontSize = `${tamanosTexto[nivel]}%`;
    textDown.setAttribute("aria-disabled", String(nivel === 0));
    textUp.setAttribute("aria-disabled", String(nivel === tamanosTexto.length - 1));
    if (guardar) {
      guardarPreferencia("tutorial-texto", String(nivel), `Tamaño del texto: ${tamanosTexto[nivel]}%.`);
    }
  }

  aplicarTexto(nivelTexto);
  textDown.addEventListener("click", () => {
    if (nivelTexto > 0) aplicarTexto(nivelTexto - 1, true);
  });
  textUp.addEventListener("click", () => {
    if (nivelTexto < tamanosTexto.length - 1) aplicarTexto(nivelTexto + 1, true);
  });

  /* ---------- Menú lateral en pantallas pequeñas ---------- */
  function cerrarMenu(devolverFoco = false) {
    sidebar.classList.remove("is-open");
    menuScrim.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir navegación");
    if (devolverFoco) menuButton.focus();
  }

  menuButton.addEventListener("click", () => {
    const abrir = !sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open", abrir);
    menuScrim.hidden = !abrir;
    menuButton.setAttribute("aria-expanded", String(abrir));
    menuButton.setAttribute("aria-label", abrir ? "Cerrar navegación" : "Abrir navegación");
    if (abrir) sidebar.querySelector("a")?.focus();
  });

  menuScrim.addEventListener("click", () => cerrarMenu(true));
  sidebar.addEventListener("click", (evento) => {
    const enlace = evento.target.closest("a");
    if (!enlace) return;
    const destino = document.querySelector(enlace.getAttribute("href"));
    if (destino) marcarEnlaceActivo(destino.id);
    cerrarMenu();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && sidebar.classList.contains("is-open")) {
      cerrarMenu(true);
    }
  });

  /* ---------- Índice lateral y aparición progresiva ---------- */
  const enlacesIndice = [...sidebar.querySelectorAll(".nav-link")];
  const destinosIndice = enlacesIndice
    .map((enlace) => document.querySelector(enlace.getAttribute("href")))
    .filter(Boolean);

  function marcarEnlaceActivo(id) {
    enlacesIndice.forEach((enlace) => {
      if (enlace.getAttribute("href") === `#${id}`) {
        enlace.setAttribute("aria-current", "location");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });
    if (document.getElementById(id)) {
      almacen.guardar("tutorial-ultimo-id", id);
      continueLink.href = `#${id}`;
      continueLink.hidden = id === "inicio";
      const titulo = document.getElementById(id).querySelector("h2, h3");
      resumeNote.textContent = id === "inicio" || !titulo
        ? ""
        : `Puedes continuar desde “${titulo.textContent}”.`;
    }
  }

  const continueLink = $("continueLink");
  const resumeNote = $("resumeNote");
  const ultimoId = almacen.leer("tutorial-ultimo-id");
  const ultimaSeccion = ultimoId && document.getElementById(ultimoId);
  if (ultimaSeccion && ultimoId !== "inicio") {
    continueLink.href = `#${ultimoId}`;
    continueLink.hidden = false;
    resumeNote.textContent = `Puedes continuar desde “${ultimaSeccion.querySelector("h2, h3")?.textContent || ultimaSeccion.id}”.`;
  }

  if ("IntersectionObserver" in window) {
    const observadorIndice = new IntersectionObserver((entradas) => {
      const visibles = entradas
        .filter((entrada) => entrada.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visibles[0]) marcarEnlaceActivo(visibles[0].target.id);
    }, { rootMargin: "-18% 0px -72% 0px" });
    destinosIndice.forEach((destino) => observadorIndice.observe(destino));

    const observadorAparicion = new IntersectionObserver((entradas, observador) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "0px 0px 80px 0px" });
    document.querySelectorAll(".reveal").forEach((elemento) => observadorAparicion.observe(elemento));
  } else {
    document.querySelectorAll(".reveal").forEach((elemento) => elemento.classList.add("is-visible"));
  }

  /* ---------- Pestañas accesibles ---------- */
  document.querySelectorAll('[role="tablist"]').forEach((lista) => {
    const tabs = [...lista.querySelectorAll('[role="tab"]')];

    function seleccionarTab(tab, moverFoco = false) {
      tabs.forEach((elemento) => {
        const seleccionado = elemento === tab;
        elemento.classList.toggle("is-active", seleccionado);
        elemento.setAttribute("aria-selected", String(seleccionado));
        elemento.tabIndex = seleccionado ? 0 : -1;
        $(elemento.getAttribute("aria-controls")).hidden = !seleccionado;
      });
      if (moverFoco) tab.focus();
    }

    lista.addEventListener("click", (evento) => {
      const tab = evento.target.closest('[role="tab"]');
      if (tab && lista.contains(tab)) seleccionarTab(tab);
    });

    lista.addEventListener("keydown", (evento) => {
      const indiceActual = tabs.indexOf(document.activeElement);
      if (indiceActual < 0) return;

      let indiceNuevo;
      if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
        indiceNuevo = (indiceActual + 1) % tabs.length;
      } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
        indiceNuevo = (indiceActual - 1 + tabs.length) % tabs.length;
      } else if (evento.key === "Home") {
        indiceNuevo = 0;
      } else if (evento.key === "End") {
        indiceNuevo = tabs.length - 1;
      } else {
        return;
      }

      evento.preventDefault();
      seleccionarTab(tabs[indiceNuevo], true);
    });
  });

  /* ---------- Copiar código ---------- */
  async function copiarTexto(texto) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return;
    }

    const areaTemporal = document.createElement("textarea");
    areaTemporal.value = texto;
    areaTemporal.setAttribute("readonly", "");
    areaTemporal.style.position = "fixed";
    areaTemporal.style.opacity = "0";
    document.body.append(areaTemporal);
    areaTemporal.select();
    const copiado = document.execCommand("copy");
    areaTemporal.remove();
    if (!copiado) throw new Error("No se pudo copiar");
  }

  document.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-copy]");
    if (!boton) return;
    const textoOriginal = boton.dataset.original || boton.textContent;
    boton.dataset.original = textoOriginal;
    const codigo = boton.closest(".code-block")?.querySelector("pre code")?.textContent;

    function restaurar() {
      setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.removeAttribute("aria-label");
      }, 2200);
    }

    if (!codigo) {
      boton.textContent = "No hay código para copiar";
      restaurar();
      return;
    }

    try {
      await copiarTexto(codigo);
      boton.textContent = "Copiado";
      boton.setAttribute("aria-label", "Código copiado al portapapeles");
    } catch {
      boton.textContent = "No se pudo copiar";
      boton.setAttribute("aria-label", "No se pudo copiar el código");
    }
    restaurar();
  });

  /* ---------- Videos de YouTube con carga al hacer clic ---------- */
  function extraerIdVideo(valor) {
    const texto = (valor || "").trim();
    if (/^[\w-]{11}$/.test(texto)) return texto;
    const coincidencia = texto.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return coincidencia ? coincidencia[1] : null;
  }

  document.querySelectorAll(".video-frame").forEach((marco) => {
    const boton = marco.querySelector(".video-play");
    const tarjeta = marco.closest(".video-card");
    const mensaje = tarjeta.querySelector(".video-msg");
    const enlace = tarjeta.querySelector(".video-link");
    const idVideo = extraerIdVideo(marco.dataset.video);

    if (!idVideo) {
      boton.disabled = true;
      boton.querySelector("span").textContent = "Video pendiente";
      mensaje.textContent = "Aún no hay un video asignado. Pega el enlace de YouTube en el atributo data-video de este bloque en index.html.";
      return;
    }

    enlace.href = `https://www.youtube.com/watch?v=${idVideo}`;
    enlace.hidden = false;
    mensaje.textContent = "El video se carga solo al pulsar el botón. Puedes activar subtítulos desde el reproductor.";

    boton.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${idVideo}?rel=0`;
      iframe.title = marco.dataset.title || "Video de YouTube";
      iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.loading = "lazy";
      boton.replaceWith(iframe);
      iframe.focus();
      mensaje.textContent = "Video cargado.";
    });
  });

  /* ---------- Búsqueda y filtros ---------- */
  const secciones = [...document.querySelectorAll(".topic-section")];
  const lecciones = [...document.querySelectorAll(".topic-section .lesson")];
  const chips = [...document.querySelectorAll("[data-filter]")];
  let filtroActivo = "all";

  /* El texto se guarda antes de insertar botones de navegación para no ensuciar la búsqueda. */
  lecciones.forEach((leccion) => {
    leccion.dataset.texto = leccion.textContent.toLocaleLowerCase("es");
  });

  $("searchForm").addEventListener("submit", (evento) => evento.preventDefault());

  function aplicarFiltros() {
    const consulta = searchInput.value.trim().toLocaleLowerCase("es");
    let total = 0;

    secciones.forEach((seccion) => {
      const tema = seccion.dataset.topic;
      const temaPermitido = filtroActivo === "all" || filtroActivo === "videos" || filtroActivo === tema;
      const tituloSeccion = seccion.querySelector(".topic-heading")?.textContent.toLocaleLowerCase("es") || "";
      const tituloCoincide = Boolean(consulta) && tituloSeccion.includes(consulta);
      const leccionesSeccion = [...seccion.querySelectorAll(".lesson")];

      if (!leccionesSeccion.length) {
        const coincide = !consulta || seccion.textContent.toLocaleLowerCase("es").includes(consulta);
        const mostrar = filtroActivo === "all" && coincide;
        seccion.classList.toggle("is-filtered", !mostrar);
        if (mostrar && consulta) total += 1;
        return;
      }

      let visibles = 0;

      leccionesSeccion.forEach((leccion) => {
        const pasaFiltro = temaPermitido
          && (filtroActivo !== "videos" || leccion.classList.contains("video-lesson"));
        const pasaBusqueda = !consulta || tituloCoincide || leccion.dataset.texto.includes(consulta);
        const mostrar = pasaFiltro && pasaBusqueda;
        leccion.classList.toggle("is-filtered", !mostrar);
        if (mostrar) visibles += 1;
      });

      seccion.classList.toggle("is-filtered", visibles === 0);
      total += visibles;
    });

    enlacesIndice.forEach((enlace) => {
      const destino = document.querySelector(enlace.getAttribute("href"));
      const oculto = Boolean(destino)
        && (destino.classList.contains("is-filtered") || Boolean(destino.closest(".is-filtered")));
      enlace.classList.toggle("is-filtered", oculto);
    });

    chips.forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.filter === filtroActivo));
    });

    const filtrando = Boolean(consulta) || filtroActivo !== "all";
    clearSearch.hidden = !consulta;
    searchEmpty.hidden = total > 0;
    searchStatus.textContent = !filtrando
      ? ""
      : total
        ? `${total} secciones de contenido encontradas.`
        : "No se encontraron coincidencias.";

    actualizarResultados(consulta);
    actualizarNavegacion();
  }

  function actualizarResultados(consulta) {
    searchResults.replaceChildren();
    if (!consulta) {
      searchResults.hidden = true;
      return;
    }

    const coincidenciasLecciones = lecciones.filter((leccion) => {
      return !leccion.classList.contains("is-filtered")
        && (leccion.dataset.texto.includes(consulta)
          || leccion.closest(".topic-section").querySelector(".topic-heading")
            .textContent.toLocaleLowerCase("es").includes(consulta));
    }).map((leccion) => ({
      id: leccion.id,
      titulo: leccion.querySelector("h3")?.textContent || leccion.id
    }));
    const coincidenciasSecciones = secciones
      .filter((seccion) => !seccion.querySelector(".lesson")
        && !seccion.classList.contains("is-filtered")
        && seccion.textContent.toLocaleLowerCase("es").includes(consulta))
      .map((seccion) => ({
        id: seccion.id,
        titulo: seccion.querySelector(".topic-heading h2")?.textContent || seccion.id
      }));
    const coincidencias = [...coincidenciasLecciones, ...coincidenciasSecciones].slice(0, 8);

    if (!coincidencias.length) {
      searchResults.hidden = true;
      return;
    }

    const titulo = document.createElement("h2");
    titulo.textContent = "Resultados relacionados";
    searchResults.append(titulo);
    const lista = document.createElement("ul");
    coincidencias.forEach((leccion) => {
      const elemento = document.createElement("li");
      const enlace = document.createElement("a");
      enlace.href = `#${leccion.id}`;
      enlace.textContent = leccion.titulo;
      elemento.append(enlace);
      lista.append(elemento);
    });
    searchResults.append(lista);
    searchResults.hidden = false;
  }

  searchInput.addEventListener("input", aplicarFiltros);
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    aplicarFiltros();
    searchInput.focus();
  });
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filtroActivo = chip.dataset.filter;
      aplicarFiltros();
    });
  });

  /* ---------- Botones para viajar de una lección a otra ---------- */
  function leccionesVisibles() {
    return lecciones.filter((leccion) => !leccion.classList.contains("is-filtered")
      && !leccion.closest(".topic-section").classList.contains("is-filtered"));
  }

  function crearNavegacion(leccion) {
    const nav = document.createElement("nav");
    nav.className = "lesson-nav";
    nav.setAttribute("aria-label", "Navegación entre lecciones");
    nav.innerHTML = `
      <button type="button" class="nav-step prev" data-dir="-1"><small>← Anterior</small><strong></strong></button>
      <span class="nav-counter"></span>
      <button type="button" class="nav-step next" data-dir="1"><small>Siguiente →</small><strong></strong></button>`;
    leccion.append(nav);
  }

  function configurarPaso(boton, destino) {
    const hayDestino = Boolean(destino);
    boton.disabled = !hayDestino;
    boton.classList.toggle("is-empty", !hayDestino);
    boton.querySelector("strong").textContent = hayDestino ? destino.querySelector("h3").textContent : "";
  }

  function actualizarNavegacion() {
    const visibles = leccionesVisibles();
    visibles.forEach((leccion, indice) => {
      const nav = leccion.querySelector(".lesson-nav");
      configurarPaso(nav.querySelector(".prev"), visibles[indice - 1]);
      configurarPaso(nav.querySelector(".next"), visibles[indice + 1]);
      nav.querySelector(".nav-counter").textContent = `Lección ${indice + 1} de ${visibles.length}`;
    });
  }

  function irALeccion(destino) {
    const visibles = leccionesVisibles();
    const titulo = destino.querySelector("h3");
    destino.scrollIntoView({ behavior: comportamientoDesplazamiento(), block: "start" });
    titulo.tabIndex = -1;
    titulo.focus({ preventScroll: true });
    try {
      history.replaceState(null, "", `#${destino.id}`);
    } catch {
      /* Algunos entornos locales no permiten cambiar el historial. */
    }
    marcarEnlaceActivo(destino.id);
    anunciar(`Lección ${visibles.indexOf(destino) + 1} de ${visibles.length}: ${titulo.textContent}`);
  }

  lecciones.forEach(crearNavegacion);

  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".nav-step");
    if (!boton || boton.disabled) return;
    const visibles = leccionesVisibles();
    const actual = boton.closest(".lesson");
    const destino = visibles[visibles.indexOf(actual) + Number(boton.dataset.dir)];
    if (destino) irALeccion(destino);
  });

  aplicarFiltros();

  /* ---------- Glosario interactivo ---------- */
  const glossaryInput = $("glossaryInput");
  const glossaryForm = $("glossaryForm");
  const glossaryTerms = [...document.querySelectorAll(".glossary-term")];
  const glossaryStatus = $("glossaryStatus");

  glossaryForm.addEventListener("submit", (evento) => evento.preventDefault());
  glossaryInput.addEventListener("input", () => {
    const consulta = glossaryInput.value.trim().toLocaleLowerCase("es");
    let coincidencias = 0;
    glossaryTerms.forEach((termino) => {
      const coincide = !consulta
        || termino.dataset.term.includes(consulta)
        || termino.textContent.toLocaleLowerCase("es").includes(consulta);
      termino.hidden = !coincide;
      if (coincide) coincidencias += 1;
    });
    glossaryStatus.textContent = consulta
      ? `${coincidencias} términos encontrados.`
      : `${glossaryTerms.length} términos disponibles en orden alfabético.`;
  });
  glossaryStatus.textContent = `${glossaryTerms.length} términos disponibles en orden alfabético.`;

  /* ---------- Mini quizzes y puntuación total ---------- */
  const finalScore = $("finalScore");
  const quizForms = [...document.querySelectorAll("[data-quiz]")];
  const cuestionarios = quizForms.map((formulario) => ({
    formulario,
    clave: formulario.dataset.quizKey,
    maximo: formulario.querySelectorAll("fieldset[data-answer]").length
  }));
  const maximoTotal = cuestionarios.reduce((total, cuestionario) => total + cuestionario.maximo, 0);

  function actualizarPuntuacionFinal() {
    const puntuaciones = cuestionarios.map(({ clave, maximo }) => {
      const guardado = almacen.leer(clave);
      const valor = Number(guardado);
      return guardado !== null && Number.isInteger(valor) && valor >= 0 && valor <= maximo
        ? valor
        : null;
    });
    const completados = puntuaciones.filter((puntuacion) => puntuacion !== null).length;
    if (!completados) {
      finalScore.textContent = "Completa los siete mini quizzes para ver tu puntuación total.";
      return;
    }

    const aciertos = puntuaciones.reduce((total, puntuacion) => total + Number(puntuacion || 0), 0);
    finalScore.textContent = completados === cuestionarios.length
      ? `¡Recorrido completado! Tu puntuación final es ${aciertos} de ${maximoTotal}.`
      : `Llevas ${aciertos} aciertos en ${completados} de ${cuestionarios.length} módulos. Completa los quizzes restantes para obtener tu puntuación final de ${maximoTotal}.`;
  }

  cuestionarios.forEach(({ formulario, clave, maximo }) => {
    const puntuacionGuardada = almacen.leer(clave);
    if (puntuacionGuardada !== null) {
      const salida = formulario.querySelector(".quiz-result");
      const puntuacion = Number(puntuacionGuardada);
      if (Number.isInteger(puntuacion) && puntuacion >= 0 && puntuacion <= maximo) {
        salida.textContent = `Puntuación guardada: ${puntuacion} de ${maximo}. Puedes volver a responder para actualizarla.`;
        salida.dataset.state = puntuacion === maximo ? "success" : "error";
      }
    }

    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const preguntas = [...formulario.querySelectorAll("fieldset[data-answer]")];
      const aciertos = preguntas.reduce((total, pregunta) => {
        const seleccionada = pregunta.querySelector('input[type="radio"]:checked');
        return total + (seleccionada?.value === pregunta.dataset.answer ? 1 : 0);
      }, 0);
      const resultado = formulario.querySelector(".quiz-result");
      const mensaje = aciertos === preguntas.length
        ? `¡Excelente! Módulo completado: ${aciertos} de ${preguntas.length} respuestas correctas.`
        : `Obtuviste ${aciertos} de ${preguntas.length}. Revisa el tema e inténtalo otra vez.`;
      resultado.textContent = mensaje;
      resultado.dataset.state = aciertos === preguntas.length ? "success" : "error";
      if (!almacen.guardar(clave, String(aciertos))) {
        resultado.textContent += " No se pudo guardar el puntaje en este navegador.";
      }
      actualizarPuntuacionFinal();
    });
  });
  actualizarPuntuacionFinal();

  /* ---------- Demo de localStorage ---------- */
  const noteForm = $("noteForm");
  const noteInput = $("noteInput");
  const noteMessage = $("noteMessage");
  const noteKey = "tutorial-nota";

  function mostrarNotaGuardada() {
    try {
      const nota = localStorage.getItem(noteKey);
      if (nota) {
        noteInput.value = nota;
        noteMessage.textContent = `Nota guardada: ${nota}`;
      } else {
        noteMessage.textContent = "Todavía no hay una nota guardada.";
      }
    } catch {
      noteMessage.textContent = "No se pudo acceder al almacenamiento de este navegador.";
    }
  }

  noteForm.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nota = noteInput.value.trim();
    if (!nota) {
      noteMessage.textContent = "Escribe una nota antes de guardarla.";
      noteInput.focus();
      return;
    }

    try {
      localStorage.setItem(noteKey, nota);
      noteMessage.textContent = `Nota guardada: ${nota}`;
    } catch {
      noteMessage.textContent = "No se pudo guardar la nota. Revisa la configuración del navegador.";
    }
  });

  $("deleteNote").addEventListener("click", () => {
    try {
      localStorage.removeItem(noteKey);
      noteInput.value = "";
      noteMessage.textContent = "La nota se borró.";
    } catch {
      noteMessage.textContent = "No se pudo borrar la nota desde este navegador.";
    }
  });

  mostrarNotaGuardada();

  /* ---------- Progreso de lectura y volver arriba ---------- */
  let actualizacionPendiente = false;
  function actualizarProgreso() {
    const desplazable = document.documentElement.scrollHeight - window.innerHeight;
    const porcentaje = desplazable > 0
      ? Math.min(100, Math.max(0, Math.round((window.scrollY / desplazable) * 100)))
      : 0;
    progressBar.style.width = `${porcentaje}%`;
    progress.setAttribute("aria-valuenow", String(porcentaje));
    progress.setAttribute("aria-valuetext", `${porcentaje}% leído`);
    backToTop.hidden = window.scrollY < 500;
    actualizacionPendiente = false;
  }

  window.addEventListener("scroll", () => {
    if (!actualizacionPendiente) {
      actualizacionPendiente = true;
      window.requestAnimationFrame(actualizarProgreso);
    }
  }, { passive: true });

  window.addEventListener("resize", actualizarProgreso, { passive: true });
  backToTop.addEventListener("click", () => {
    $("inicio").scrollIntoView({ behavior: comportamientoDesplazamiento() });
  });
  actualizarProgreso();
})();
