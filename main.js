/* Interacciones accesibles y sin dependencias externas. */
(() => {
  "use strict";

  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const themeButton = document.getElementById("themeButton");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menuButton");
  const menuScrim = document.getElementById("menuScrim");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const searchStatus = document.getElementById("searchStatus");
  const searchEmpty = document.getElementById("searchEmpty");
  const progress = document.getElementById("readingProgress");
  const progressBar = document.getElementById("readingProgressBar");
  const backToTop = document.getElementById("backToTop");

  document.body.classList.add("js-ready");

  function leerPreferenciaTema() {
    try {
      return localStorage.getItem("tutorial-tema");
    } catch {
      return null;
    }
  }

  function aplicarTema(tema, guardar = false) {
    const oscuro = tema === "dark";
    root.dataset.theme = oscuro ? "dark" : "light";
    themeButton.setAttribute("aria-label", oscuro ? "Activar modo claro" : "Activar modo oscuro");
    themeButton.setAttribute("aria-pressed", String(oscuro));
    themeMeta.setAttribute("content", oscuro ? "#101821" : "#f5f7fa");

    if (guardar) {
      try {
        localStorage.setItem("tutorial-tema", tema);
      } catch {
        searchStatus.textContent = "El tema cambió, pero no se pudo guardar tu preferencia en este navegador.";
      }
    }
  }

  const temaGuardado = leerPreferenciaTema();
  aplicarTema(temaGuardado === "light" || temaGuardado === "dark"
    ? temaGuardado
    : (prefersDark.matches ? "dark" : "light"));

  themeButton.addEventListener("click", () => {
    aplicarTema(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  prefersDark.addEventListener("change", (evento) => {
    if (!leerPreferenciaTema()) {
      aplicarTema(evento.matches ? "dark" : "light");
    }
  });

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
    if (evento.target.closest("a")) cerrarMenu();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && sidebar.classList.contains("is-open")) {
      cerrarMenu(true);
    }
  });

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

  const tabListas = document.querySelectorAll('[role="tablist"]');
  tabListas.forEach((lista) => {
    const tabs = [...lista.querySelectorAll('[role="tab"]')];

    function seleccionarTab(tab, moverFoco = false) {
      tabs.forEach((elemento) => {
        const seleccionado = elemento === tab;
        elemento.classList.toggle("is-active", seleccionado);
        elemento.setAttribute("aria-selected", String(seleccionado));
        elemento.tabIndex = seleccionado ? 0 : -1;
        document.getElementById(elemento.getAttribute("aria-controls")).hidden = !seleccionado;
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
    const codigo = boton.closest(".code-block")?.querySelector("pre code")?.textContent;
    if (!codigo) {
      boton.textContent = "No hay código para copiar";
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
  });

  document.getElementById("searchForm").addEventListener("submit", (evento) => evento.preventDefault());

  function filtrarContenido() {
    const consulta = searchInput.value.trim().toLocaleLowerCase("es");
    const secciones = [...document.querySelectorAll(".topic-section")];
    let totalCoincidencias = 0;

    secciones.forEach((seccion) => {
      const lecciones = [...seccion.querySelectorAll("[data-searchable]")];
      const tituloCoincide = seccion.querySelector(".topic-heading").textContent
        .toLocaleLowerCase("es").includes(consulta);
      let coincidenciasSeccion = 0;

      lecciones.forEach((leccion) => {
        const coincide = !consulta || tituloCoincide
          || leccion.textContent.toLocaleLowerCase("es").includes(consulta);
        leccion.classList.toggle("is-filtered", !coincide);
        if (coincide) coincidenciasSeccion += 1;
      });

      seccion.classList.toggle("is-filtered", Boolean(consulta) && coincidenciasSeccion === 0);
      totalCoincidencias += coincidenciasSeccion;
    });

    const buscando = Boolean(consulta);
    clearSearch.hidden = !buscando;
    searchEmpty.hidden = !buscando || totalCoincidencias > 0;
    searchStatus.textContent = !buscando
      ? ""
      : totalCoincidencias
        ? `${totalCoincidencias} secciones de contenido encontradas.`
        : "No se encontraron coincidencias.";
  }

  searchInput.addEventListener("input", filtrarContenido);
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    filtrarContenido();
    searchInput.focus();
  });

  document.querySelectorAll("[data-quiz]").forEach((formulario) => {
    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const preguntas = [...formulario.querySelectorAll("fieldset[data-answer]")];
      const aciertos = preguntas.reduce((total, pregunta) => {
        const seleccionada = pregunta.querySelector('input[type="radio"]:checked');
        return total + (seleccionada?.value === pregunta.dataset.answer ? 1 : 0);
      }, 0);
      const resultado = formulario.querySelector(".quiz-result");
      const mensaje = aciertos === preguntas.length
        ? `¡Excelente! Obtuviste ${aciertos} de ${preguntas.length} respuestas correctas.`
        : `Obtuviste ${aciertos} de ${preguntas.length}. Revisa el tema e inténtalo otra vez.`;
      resultado.textContent = mensaje;
      resultado.dataset.state = aciertos === preguntas.length ? "success" : "error";
    });
  });

  const noteForm = document.getElementById("noteForm");
  const noteInput = document.getElementById("noteInput");
  const noteMessage = document.getElementById("noteMessage");
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

  document.getElementById("deleteNote").addEventListener("click", () => {
    try {
      localStorage.removeItem(noteKey);
      noteInput.value = "";
      noteMessage.textContent = "La nota se borró.";
    } catch {
      noteMessage.textContent = "No se pudo borrar la nota desde este navegador.";
    }
  });

  mostrarNotaGuardada();

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
    document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
  });
  actualizarProgreso();
})();
