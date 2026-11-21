// ============================================================
// MOTOR DEL SISTEMA: dibuja el menú, controla accesos y cambia de pantalla.
// Normalmente no hace falta tocar este archivo.
// ============================================================
function esc(t) {
  return String(t).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

const Sistema = {
  modulos: {},   // pantallas registradas: id -> función(contenedor, subruta, modulo)
  subs: {},      // sub-pantallas: "id/sub" -> función(contenedor)
  _escuchando: false,

  registrar(id, funcion) { this.modulos[id] = funcion; },
  registrarSub(id, sub, funcion) { this.subs[id + "/" + sub] = funcion; },
  buscar(id) { return MENU.find(m => m.id === id) || null; },
  // "pendiente" = sección final que todavía no tiene su archivo en js/modulos/
  pendiente(id) { return !this.modulos[id] && !this.hijos(id).length; },
  hijos(id) { return MENU.filter(m => m.padre === id); },

  iniciar() {
    if (!Seguridad.disponible()) {
      document.getElementById("acceso").hidden = false;
      document.getElementById("acceso").innerHTML =
        '<div class="tarjeta-acceso"><h1>Navegador bloqueado</h1><p class="suave">' +
        'Este navegador no deja guardar datos de la página. Prueba con Chrome, Edge o Firefox, asegúrate de no estar en modo privado ' +
        'y, si lo abriste con doble clic, prueba mejor desde la dirección de GitHub Pages.</p></div>';
      return;
    }
    if (Seguridad.actual()) { this.arrancar(); return; }
    document.querySelector(".app").hidden = true;
    Seguridad.pantallaAcceso(() => this.arrancar());
  },

  arrancar() {
    document.querySelector(".app").hidden = false;
    this.dibujarMenu();
    this.dibujarSesion();
    if (!this._escuchando) {
      window.addEventListener("hashchange", () => this.mostrar());
      // Botón "Menú" del celular: abre/cierra la lista de secciones
      document.getElementById("btn-menu").addEventListener("click", () => this.alternarMenu());
      document.getElementById("menu").addEventListener("click", e => { if (e.target.closest("a")) this.alternarMenu(false); });
      this._escuchando = true;
    }
    var actual = location.hash.slice(1).split("/")[0];
    var inicio = this.buscar(actual) && Seguridad.puede(actual) ? actual : this.primerPermitido();
    if (location.hash === "#" + inicio) this.mostrar();
    else location.hash = "#" + inicio;
  },

  // Abre o cierra el menú en celular (abrir: true/false; sin dato = alternar)
  alternarMenu(abrir) {
    var m = document.querySelector(".menu"), b = document.getElementById("btn-menu");
    var a = abrir === undefined ? !m.classList.contains("abierto") : abrir;
    m.classList.toggle("abierto", a);
    b.setAttribute("aria-expanded", a ? "true" : "false");
    b.querySelector("span").textContent = a ? "Cerrar" : "Menú";
  },

  primerPermitido() {
    var m = MENU.find(x => Seguridad.puede(x.id));
    return m ? m.id : MENU[0].id;
  },

  // Menú plano: todas las secciones al mismo nivel, cada una con su icono
  dibujarMenu() {
    var nav = document.getElementById("menu"), self = this;
    nav.innerHTML = "";
    MENU.filter(m => Seguridad.puede(m.id)).forEach(function (m) {
      var a = document.createElement("a");
      a.className = "item" + (self.pendiente(m.id) ? " pendiente" : "");
      a.href = "#" + m.id;
      a.dataset.id = m.id;
      a.innerHTML = icono(m.id) + '<span class="txt"></span>';
      a.querySelector(".txt").textContent = m.titulo;
      nav.appendChild(a);
    });
  },

  dibujarSesion() {
    var u = Seguridad.actual(), box = document.getElementById("sesion");
    box.innerHTML = '<div class="quien"><span class="avatar"></span><div><b></b><small></small></div></div>' +
                    '<button class="btn salir" type="button">Cerrar sesión</button>';
    box.querySelector(".avatar").textContent = u.nombre.charAt(0).toUpperCase();
    box.querySelector("b").textContent = u.nombre;
    box.querySelector("small").textContent = u.admin ? "Administrador" : "Usuario";
    box.querySelector(".salir").addEventListener("click", function () {
      Seguridad.cerrarSesion(); location.hash = ""; location.reload();
    });
  },

  mostrar() {
    var partes = location.hash.slice(1).split("/"), id = partes[0], sub = partes[1];
    var modulo = this.buscar(id);
    var cont = document.getElementById("contenido");
    cont.innerHTML = "";
    this.alternarMenu(false);
    if (!modulo) { location.hash = "#" + this.primerPermitido(); return; }

    document.querySelectorAll("#menu a.item").forEach(a => {
      a.classList.toggle("activo", a.dataset.id === modulo.id);
      a.classList.toggle("pendiente", this.pendiente(a.dataset.id));
    });
    document.title = modulo.titulo + " · Sistema Contable LSA";

    if (!Seguridad.puede(modulo.id)) { this.sinAcceso(cont, modulo); return; }

    var render = this.modulos[modulo.id];
    if (render) render(cont, sub, modulo);
    else if (this.hijos(modulo.id).length) this.pantallaGrupo(cont, modulo);
    else this.enConstruccion(cont, [modulo.titulo]);
  },

  // Pantalla de un grupo (Contabilidad, Finanzas): botones a sus secciones
  pantallaGrupo(cont, modulo) {
    cont.innerHTML = '<p class="ruta"></p><h1></h1><p class="suave">Elige una opción:</p><div class="rejilla" id="rej"></div>';
    cont.querySelector(".ruta").textContent = "Estás en: " + modulo.titulo;
    cont.querySelector("h1").textContent = modulo.titulo;
    var rej = cont.querySelector("#rej");
    this.hijos(modulo.id).filter(h => Seguridad.puede(h.id)).forEach(function (h) {
      var a = document.createElement("a");
      a.className = "tarjeta-boton";
      a.href = "#" + h.id;
      a.innerHTML = '<span class="cabeza"><span class="icono-caja">' + icono(h.id) + '</span><span class="flecha">→</span></span><span class="t"></span>';
      a.querySelector(".t").textContent = h.titulo;
      rej.appendChild(a);
    });
  },

  sinAcceso(cont, modulo) {
    cont.innerHTML = '<p class="ruta"></p><h1>Sin acceso</h1><div class="aviso">Tu usuario no tiene permiso para entrar a esta sección. Pídele al administrador que te la active.</div>';
    cont.querySelector(".ruta").textContent = "Estás en: " + modulo.titulo;
  },

  // Pantalla temporal: "Estás en ... (en construcción)"
  enConstruccion(cont, ruta) {
    cont.innerHTML =
      '<p class="ruta"></p><h1></h1>' +
      '<div class="aviso"><strong>Estás en:</strong> <span id="donde"></span><br>' +
      'Esta sección está en construcción. Aquí iremos agregando sus funciones.</div>';
    cont.querySelector(".ruta").textContent = "Estás en: " + ruta.join(" › ");
    cont.querySelector("h1").textContent = ruta[ruta.length - 1];
    cont.querySelector("#donde").textContent = ruta.join(" › ");
  },

  // Ventana emergente. alAceptar() devuelve true para cerrar, o un texto de error.
  modal(titulo, cuerpo, textoAceptar, alAceptar) {
    var fondo = document.createElement("div");
    fondo.className = "modal-fondo";
    fondo.innerHTML = '<div class="modal" role="dialog"><h2></h2><div class="cuerpo"></div><div class="error"></div>' +
      '<div class="acciones"><button class="btn" type="button" data-x="no">Cancelar</button>' +
      '<button class="btn primario" type="button" data-x="si"></button></div></div>';
    fondo.querySelector("h2").textContent = titulo;
    fondo.querySelector("[data-x=si]").textContent = textoAceptar;
    fondo.querySelector(".cuerpo").appendChild(cuerpo);
    function cerrar() { document.body.removeChild(fondo); }
    fondo.querySelector("[data-x=no]").addEventListener("click", cerrar);
    fondo.querySelector("[data-x=si]").addEventListener("click", function () {
      var r = alAceptar();
      if (r === true) cerrar(); else fondo.querySelector(".error").textContent = r || "";
    });
    document.body.appendChild(fondo);
  }
};
