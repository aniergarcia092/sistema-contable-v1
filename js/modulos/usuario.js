// ============================================================
// SUB-MÓDULO: CONFIGURACIÓN › USUARIO
// - Todos: cambiar su propia contraseña.
// - Administrador: agregar usuarios, elegir sus accesos,
//   restablecer contraseñas y eliminar usuarios.
// ============================================================
Sistema.registrarSub("configuracion", "usuario", function (cont) {
  var yo = Seguridad.actual();

  function chk(m, sel, sub) {
    return '<label class="chk' + (sub ? " sub" : "") + '"><input type="checkbox" value="' + m.id + '"' +
           (sel.indexOf(m.id) >= 0 ? " checked" : "") + "> " + esc(m.titulo) + "</label>";
  }
  function htmlAccesos(sel) {
    var h = '<div class="accesos">';
    MENU.filter(m => !m.padre).forEach(function (p) {
      h += chk(p, sel, false);
      Sistema.hijos(p.id).forEach(c => { h += chk(c, sel, true); });
    });
    return h + "</div>";
  }
  function leerAccesos(raiz) {
    return Array.prototype.map.call(raiz.querySelectorAll(".accesos input:checked"), i => i.value);
  }
  function enlazarAdmin(raiz) {
    var adm = raiz.querySelector(".es-admin"), acc = raiz.querySelector(".accesos");
    function f() { acc.classList.toggle("apagado", adm.checked); Array.prototype.forEach.call(acc.querySelectorAll("input"), i => { i.disabled = adm.checked; }); }
    adm.addEventListener("change", f); f();
  }
  function resumen(u) {
    if (u.admin) return '<span class="insignia admin">Administrador · todo</span>';
    if (!u.permisos.length) return '<span class="suave">Sin accesos</span>';
    return u.permisos.map(id => { var m = Sistema.buscar(id); return m ? '<span class="insignia">' + esc(m.titulo) + "</span>" : ""; }).join(" ");
  }

  function pintar() {
    yo = Seguridad.actual();
    var h = '<p class="ruta">Estás en: Configuración › Usuario</p><h1>Usuario</h1>' +
      '<a class="volver" href="#configuracion">← Volver a Configuración</a>';

    // --- cambiar mi contraseña (todos) ---
    h += '<section class="panel"><h2>Cambiar mi contraseña</h2>' +
      '<p class="suave">Usuario: <b>' + esc(yo.nombre) + "</b></p>" +
      '<form id="f-clave" class="formulario">' +
      '<label>Contraseña actual<input name="a" type="password" autocomplete="current-password" required></label>' +
      '<label>Contraseña nueva<input name="n" type="password" autocomplete="new-password" required></label>' +
      '<label>Repetir la nueva<input name="n2" type="password" autocomplete="new-password" required></label>' +
      '<div class="error" id="e-clave"></div><div class="ok" id="o-clave"></div>' +
      '<button class="btn primario" type="submit">Guardar contraseña</button></form></section>';

    if (yo.admin) {
      // --- lista de usuarios ---
      h += '<section class="panel"><h2>Usuarios registrados</h2><div class="tabla-caja"><table><thead><tr><th>Usuario</th><th>Accesos</th><th></th></tr></thead><tbody>';
      Seguridad.usuarios().forEach(function (u) {
        h += "<tr><td><b>" + esc(u.nombre) + "</b></td><td>" + resumen(u) + "</td>" +
          '<td class="acc"><button class="btn peq" data-a="acceso" data-u="' + esc(u.nombre) + '">Accesos</button> ' +
          '<button class="btn peq" data-a="clave" data-u="' + esc(u.nombre) + '">Nueva contraseña</button> ' +
          '<button class="btn peq peligro" data-a="borrar" data-u="' + esc(u.nombre) + '">Eliminar</button></td></tr>';
      });
      h += "</tbody></table></div></section>";

      // --- agregar usuario ---
      h += '<section class="panel"><h2>Agregar usuario</h2><form id="f-nuevo" class="formulario">' +
        '<label>Usuario<input name="u" type="text" autocomplete="off" required></label>' +
        '<label>Contraseña<input name="c" type="password" autocomplete="new-password" required></label>' +
        '<label>Repetir contraseña<input name="c2" type="password" autocomplete="new-password" required></label>' +
        '<label class="chk grande"><input type="checkbox" class="es-admin"> Administrador (acceso a todo y puede manejar usuarios)</label>' +
        '<p class="suave">Si no es administrador, marca a qué secciones puede entrar:</p>' + htmlAccesos([]) +
        '<div class="error" id="e-nuevo"></div><div class="ok" id="o-nuevo"></div>' +
        '<button class="btn primario" type="submit">Agregar usuario</button></form></section>';
    }
    cont.innerHTML = h;
    enlazar();
  }

  function enlazar() {
    // cambiar contraseña
    var f = cont.querySelector("#f-clave");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var e = cont.querySelector("#e-clave"), o = cont.querySelector("#o-clave");
      e.textContent = ""; o.textContent = "";
      if (f.n.value !== f.n2.value) { e.textContent = "La contraseña nueva no coincide."; return; }
      var r = Seguridad.cambiarClave(yo.nombre, f.a.value, f.n.value);
      if (!r.ok) { e.textContent = r.error; return; }
      f.reset(); o.textContent = "Contraseña cambiada.";
    });

    if (!yo.admin) return;

    // agregar usuario
    var n = cont.querySelector("#f-nuevo");
    enlazarAdmin(n);
    n.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var e = cont.querySelector("#e-nuevo");
      if (n.c.value !== n.c2.value) { e.textContent = "Las contraseñas no coinciden."; return; }
      var admin = n.querySelector(".es-admin").checked, permisos = leerAccesos(n);
      if (!admin && !permisos.length) { e.textContent = "Marca al menos un acceso o márcalo como administrador."; return; }
      var r = Seguridad.crear(n.u.value, n.c.value, admin, permisos);
      if (!r.ok) { e.textContent = r.error; return; }
      pintar();
      cont.querySelector("#o-nuevo").textContent = "Usuario agregado.";
    });

    // acciones de la tabla
    cont.querySelector("tbody").addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      var nombre = b.dataset.u, u = Seguridad.buscar(nombre);
      if (b.dataset.a === "borrar") {
        if (!confirm("¿Eliminar al usuario " + nombre + "?")) return;
        var r = Seguridad.eliminar(nombre);
        if (!r.ok) alert(r.error); else pintar();
      } else if (b.dataset.a === "clave") {
        var cuerpo = document.createElement("div");
        cuerpo.className = "formulario";
        cuerpo.innerHTML = '<label>Contraseña nueva<input name="n" type="password" autocomplete="new-password"></label>' +
                           '<label>Repetir<input name="n2" type="password" autocomplete="new-password"></label>';
        Sistema.modal("Nueva contraseña para " + nombre, cuerpo, "Guardar", function () {
          var a = cuerpo.querySelector("[name=n]").value, c = cuerpo.querySelector("[name=n2]").value;
          if (a !== c) return "Las contraseñas no coinciden.";
          var r = Seguridad.restablecerClave(nombre, a);
          return r.ok ? true : r.error;
        });
      } else if (b.dataset.a === "acceso") {
        var cuerpo2 = document.createElement("div");
        cuerpo2.innerHTML = '<label class="chk grande"><input type="checkbox" class="es-admin"' + (u.admin ? " checked" : "") +
          "> Administrador</label>" + htmlAccesos(u.permisos);
        enlazarAdmin(cuerpo2);
        Sistema.modal("Accesos de " + nombre, cuerpo2, "Guardar", function () {
          var adm = cuerpo2.querySelector(".es-admin").checked, perm = leerAccesos(cuerpo2);
          var r = Seguridad.actualizarAcceso(nombre, adm, perm);
          if (!r.ok) return r.error;
          pintar();
          Sistema.dibujarMenu(); Sistema.dibujarSesion();
          return true;
        });
      }
    });
  }

  pintar();
});
