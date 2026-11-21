// ============================================================
// SEGURIDAD: usuarios, contraseñas, accesos y sesión.
// Los datos se guardan en la base de datos del navegador (js/bd.js).
// Las contraseñas NO se guardan: solo su "huella" (SHA-256 con sal).
// OJO: al ser una página local, esto protege el uso normal pero no es
// seguridad de servidor. Para datos importantes habrá que pasarlo a servidor.
// ============================================================

// --- SHA-256 (para guardar huellas en vez de contraseñas) ---
function sha256(ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  var mp = Math.pow, mw = mp(2, 32), i, j, result = "", words = [], bits = ascii.length * 8;
  var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pc = k.length, comp = {};
  for (var c = 2; pc < 64; c++) {
    if (!comp[c]) {
      for (i = 0; i < 313; i += c) comp[i] = c;
      hash[pc] = (mp(c, 0.5) * mw) | 0;
      k[pc++] = (mp(c, 1 / 3) * mw) | 0;
    }
  }
  ascii += "\x80";
  while (ascii.length % 64 - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((bits / mw) | 0);
  words[words.length] = bits;
  for (j = 0; j < words.length;) {
    var w = words.slice(j, j += 16), old = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
      var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
        (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
          (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
  }
  for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
    var b = (hash[i] >> (j * 8)) & 255;
    result += (b < 16 ? 0 : "") + b.toString(16);
  }
  return result;
}

const Seguridad = {
  CLAVE: "usuarios",   // nombre de la colección en la base de datos (BD)
  SESION: "sc_sesion_v1",

  // ---------- almacenamiento ----------
  disponible() { return BD.listo; },
  usuarios() { return BD.leer(this.CLAVE, []); },
  guardar(lista) { return BD.guardar(this.CLAVE, lista); },
  hayUsuarios() { return this.usuarios().length > 0; },
  buscar(nombre) {
    nombre = String(nombre || "").trim().toLowerCase();
    return this.usuarios().find(u => u.nombre.toLowerCase() === nombre) || null;
  },

  // ---------- contraseñas ----------
  _sal() {
    var s = "";
    for (var i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  },
  _huella(clave, sal) {
    var h = sal + clave;
    for (var i = 0; i < 1000; i++) h = sha256(unescape(encodeURIComponent(h + sal + clave)));
    return h;
  },
  _validarNombre(n) {
    return /^[A-Za-z0-9._-]{3,30}$/.test(n) ? "" : "El usuario debe tener 3 a 30 letras, números, punto, guion o guion bajo (sin espacios).";
  },
  _validarClave(c) {
    return c.length >= 6 ? "" : "La contraseña debe tener al menos 6 caracteres.";
  },

  // ---------- gestión de usuarios ----------
  crear(nombre, clave, admin, permisos) {
    nombre = String(nombre || "").trim();
    var err = this._validarNombre(nombre) || this._validarClave(clave);
    if (err) return { ok: false, error: err };
    if (this.buscar(nombre)) return { ok: false, error: "Ese usuario ya existe." };
    var sal = this._sal(), lista = this.usuarios();
    lista.push({ nombre: nombre, sal: sal, huella: this._huella(clave, sal), admin: !!admin, permisos: admin ? [] : (permisos || []) });
    return this.guardar(lista) ? { ok: true } : { ok: false, error: "No se pudo guardar (el navegador bloquea el almacenamiento)." };
  },
  verificar(nombre, clave) {
    var u = this.buscar(nombre);
    return !!u && u.huella === this._huella(clave, u.sal);
  },
  cambiarClave(nombre, actual, nueva) {
    if (!this.verificar(nombre, actual)) return { ok: false, error: "La contraseña actual no es correcta." };
    return this.restablecerClave(nombre, nueva);
  },
  restablecerClave(nombre, nueva) {
    var err = this._validarClave(nueva);
    if (err) return { ok: false, error: err };
    var lista = this.usuarios(), u = lista.find(x => x.nombre.toLowerCase() === String(nombre).toLowerCase());
    if (!u) return { ok: false, error: "Usuario no encontrado." };
    u.sal = this._sal(); u.huella = this._huella(nueva, u.sal);
    return this.guardar(lista) ? { ok: true } : { ok: false, error: "No se pudo guardar." };
  },
  _admins(lista) { return lista.filter(u => u.admin).length; },
  actualizarAcceso(nombre, admin, permisos) {
    var lista = this.usuarios(), u = lista.find(x => x.nombre === nombre);
    if (!u) return { ok: false, error: "Usuario no encontrado." };
    if (u.admin && !admin && this._admins(lista) <= 1) return { ok: false, error: "Debe quedar al menos un administrador." };
    u.admin = !!admin; u.permisos = admin ? [] : permisos;
    return this.guardar(lista) ? { ok: true } : { ok: false, error: "No se pudo guardar." };
  },
  eliminar(nombre) {
    var yo = this.actual();
    if (yo && yo.nombre === nombre) return { ok: false, error: "No puedes eliminar tu propio usuario." };
    var lista = this.usuarios(), u = lista.find(x => x.nombre === nombre);
    if (!u) return { ok: false, error: "Usuario no encontrado." };
    if (u.admin && this._admins(lista) <= 1) return { ok: false, error: "Debe quedar al menos un administrador." };
    return this.guardar(lista.filter(x => x.nombre !== nombre)) ? { ok: true } : { ok: false, error: "No se pudo guardar." };
  },

  // ---------- sesión ----------
  iniciarSesion(nombre) { try { sessionStorage.setItem(this.SESION, nombre); } catch (e) {} },
  cerrarSesion() { try { sessionStorage.removeItem(this.SESION); } catch (e) {} },
  actual() {
    try { var n = sessionStorage.getItem(this.SESION); return n ? this.buscar(n) : null; } catch (e) { return null; }
  },
  esAdmin() { var u = this.actual(); return !!u && u.admin; },

  // ¿El usuario actual puede entrar a esta sección?
  puede(id) {
    var u = this.actual();
    if (!u) return false;
    if (u.admin || u.permisos.indexOf(id) >= 0) return true;
    return MENU.some(m => m.padre === id && u.permisos.indexOf(m.id) >= 0); // grupo con algún hijo permitido
  },

  // ---------- pantalla de acceso ----------
  pantallaAcceso(alEntrar) {
    var cont = document.getElementById("acceso"), primera = !this.hayUsuarios(), self = this;
    cont.hidden = false;
    cont.innerHTML =
      '<form class="tarjeta-acceso" autocomplete="on">' +
      '<div class="marca">SC</div>' +
      '<h1>' + (primera ? "Crear administrador" : "Iniciar sesión") + '</h1>' +
      '<p class="suave">' + (primera ? "Es la primera vez. Crea el usuario administrador del sistema." : "Escribe tu usuario y contraseña.") + '</p>' +
      '<label>Usuario<input name="u" type="text" autocomplete="username" required autofocus></label>' +
      '<label>Contraseña<input name="c" type="password" autocomplete="' + (primera ? "new-password" : "current-password") + '" required></label>' +
      (primera ? '<label>Repetir contraseña<input name="c2" type="password" autocomplete="new-password" required></label>' : "") +
      '<div class="error" id="err-acceso" role="alert"></div>' +
      '<button class="btn primario" type="submit">' + (primera ? "Crear y entrar" : "Entrar") + '</button>' +
      '</form>';
    var form = cont.querySelector("form"), err = cont.querySelector("#err-acceso");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var u = form.u.value.trim(), c = form.c.value;
      if (primera) {
        if (c !== form.c2.value) { err.textContent = "Las contraseñas no coinciden."; return; }
        var r = self.crear(u, c, true, []);
        if (!r.ok) { err.textContent = r.error; return; }
      } else if (!self.verificar(u, c)) {
        err.textContent = "Usuario o contraseña incorrectos."; return;
      }
      self.iniciarSesion(self.buscar(u).nombre);
      cont.hidden = true; cont.innerHTML = "";
      alEntrar();
    });
  }
};
