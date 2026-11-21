// ============================================================
// BASE DE DATOS: guarda TODO el sistema (usuarios, contabilidad, finanzas...).
// Usa IndexedDB del navegador (mucho más espacio que localStorage) y mantiene
// una copia en memoria para que leer sea inmediato.
//
// Cada módulo guarda lo suyo en una "colección" con un nombre:
//     BD.guardar("usuarios", lista)      // escribe
//     var lista = BD.leer("usuarios", []) // lee (devuelve copia; el 2º dato es el valor si no existe)
// Todo lo que se guarde así entra automáticamente en la salva (exportar/importar).
// ============================================================
const BD = {
  NOMBRE: "sistema_contable_bd",
  APP: "sistema-contable",
  FORMATO: 1,
  listo: false,
  _db: null,
  _datos: {},
  _avisado: false,

  // Abre la base y carga todo en memoria. Devuelve una promesa.
  abrir() {
    var self = this;
    return new Promise(function (ok, fallo) {
      if (!window.indexedDB) { fallo(new Error("Sin IndexedDB")); return; }
      // Si el navegador nunca responde (algunos bloquean IndexedDB), no dejar la pantalla en blanco
      var tope = setTimeout(function () { fallo(new Error("La base de datos no responde")); }, 4000);
      var ok0 = ok, fallo0 = fallo;
      ok = function (v) { clearTimeout(tope); ok0(v); };
      fallo = function (e) { clearTimeout(tope); fallo0(e); };
      var req;
      try { req = indexedDB.open(self.NOMBRE, 1); } catch (e) { fallo(e); return; }
      req.onupgradeneeded = function () { req.result.createObjectStore("datos"); };
      req.onerror = function () { fallo(req.error); };
      req.onsuccess = function () {
        self._db = req.result;
        var datos = {}, tx = self._db.transaction("datos", "readonly"), cur = tx.objectStore("datos").openCursor();
        cur.onsuccess = function () {
          var c = cur.result;
          if (c) { datos[c.key] = c.value; c.continue(); }
        };
        tx.oncomplete = function () {
          self._datos = datos;
          self._migrarAntiguo();
          self.listo = true;
          if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
          ok();
        };
        tx.onerror = function () { fallo(tx.error); };
      };
    });
  },

  // Versión anterior guardaba los usuarios en localStorage: los pasa a la base.
  _migrarAntiguo() {
    try {
      var viejo = localStorage.getItem("sc_usuarios_v1");
      if (viejo && !this._datos.usuarios) {
        this.guardar("usuarios", JSON.parse(viejo) || []);
        localStorage.removeItem("sc_usuarios_v1");
      }
    } catch (e) {}
  },

  _copia(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); },

  leer(coleccion, porDefecto) {
    return this._datos.hasOwnProperty(coleccion) ? this._copia(this._datos[coleccion]) : porDefecto;
  },

  guardar(coleccion, valor) {
    if (!this._db) return false;
    this._datos[coleccion] = this._copia(valor);
    try {
      var self = this, tx = this._db.transaction("datos", "readwrite");
      tx.objectStore("datos").put(this._datos[coleccion], coleccion);
      tx.onerror = tx.onabort = function () { self._falloEscritura(); };
    } catch (e) { this._falloEscritura(); return false; }
    return true;
  },

  borrar(coleccion) {
    delete this._datos[coleccion];
    try { this._db.transaction("datos", "readwrite").objectStore("datos").delete(coleccion); } catch (e) {}
  },

  colecciones() { return Object.keys(this._datos); },

  _falloEscritura() {
    if (this._avisado) return;
    this._avisado = true;
    alert("No se pudo guardar en la base de datos del navegador (¿disco lleno o modo privado?). Haz una salva ya y revisa el navegador.");
  },

  // ---------- SALVA ----------
  // Devuelve el contenido completo de la base como objeto.
  exportar() {
    return { app: this.APP, formato: this.FORMATO, fecha: new Date().toISOString(), datos: this._copia(this._datos) };
  },

  // Descarga la salva como archivo .json
  descargar() {
    var f = new Date(), p = n => (n < 10 ? "0" : "") + n;
    var nombre = "salva-contable-" + f.getFullYear() + "-" + p(f.getMonth() + 1) + "-" + p(f.getDate()) +
                 "_" + p(f.getHours()) + p(f.getMinutes()) + ".json";
    var blob = new Blob([JSON.stringify(this.exportar(), null, 1)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    return nombre;
  },

  // Revisa un texto de salva SIN aplicarlo. Devuelve {ok, error, salva, resumen}
  revisar(texto) {
    var s;
    try { s = JSON.parse(texto); } catch (e) { return { ok: false, error: "El archivo no es una salva válida (no se puede leer)." }; }
    if (!s || s.app !== this.APP || !s.datos || typeof s.datos !== "object" || Array.isArray(s.datos))
      return { ok: false, error: "Este archivo no es una salva de este sistema." };
    if (s.formato > this.FORMATO)
      return { ok: false, error: "La salva es de una versión más nueva del sistema." };
    var us = s.datos.usuarios;
    if (!Array.isArray(us) || !us.some(u => u && u.admin && u.nombre && u.huella && u.sal))
      return { ok: false, error: "La salva no trae ningún administrador; no se puede importar (te quedarías sin acceso)." };
    return { ok: true, salva: s, resumen: this.resumen(s.datos), fecha: s.fecha };
  },

  // Lista de {coleccion, cantidad} para mostrar qué contiene
  resumen(datos) {
    return Object.keys(datos).map(function (k) {
      var v = datos[k];
      return { coleccion: k, cantidad: Array.isArray(v) ? v.length : (v && typeof v === "object" ? Object.keys(v).length : 1) };
    });
  },

  // Reemplaza TODO por el contenido de la salva. Devuelve promesa {ok, error}
  importar(salva) {
    var self = this;
    return new Promise(function (res) {
      try {
        var tx = self._db.transaction("datos", "readwrite"), st = tx.objectStore("datos");
        st.clear();
        Object.keys(salva.datos).forEach(function (k) { st.put(salva.datos[k], k); });
        tx.oncomplete = function () { self._datos = self._copia(salva.datos); res({ ok: true }); };
        tx.onerror = tx.onabort = function () { res({ ok: false, error: "No se pudo escribir la salva. No se cambió nada." }); };
      } catch (e) { res({ ok: false, error: "No se pudo importar: " + e.message }); }
    });
  }
};
