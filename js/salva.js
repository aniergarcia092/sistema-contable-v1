// ============================================================
// SUB-MÓDULO: CONFIGURACIÓN › SALVA (copia de seguridad)
// - Guardar salva: descarga un archivo .json con TODA la base de datos.
// - Importar salva: reemplaza todos los datos por los del archivo.
// Solo el administrador. Todo lo que los módulos guarden con BD.guardar()
// entra solo en la salva; no hay que tocar este archivo al agregar módulos.
// ============================================================
Sistema.registrarSub("configuracion", "salva", function (cont) {
  var h = '<p class="ruta">Estás en: Configuración › Salva</p><h1>Salva</h1>' +
    '<a class="volver" href="#configuracion">← Volver a Configuración</a>';

  if (!Seguridad.esAdmin()) {
    cont.innerHTML = h + '<div class="aviso">Solo un administrador puede guardar o importar la salva.</div>';
    return;
  }

  h += '<section class="panel"><h2>Guardar salva</h2>' +
    '<p class="suave">Descarga un archivo con todos los datos del sistema (usuarios y lo que se vaya agregando). ' +
    'Guárdalo en un lugar seguro, por ejemplo una memoria USB. Contiene las contraseñas en forma cifrada (huella), así que cuídalo.</p>' +
    '<div class="ok" id="o-guardar"></div>' +
    '<button class="btn primario" id="b-guardar" type="button">Guardar salva</button></section>';

  h += '<section class="panel"><h2>Importar salva</h2>' +
    '<p class="suave"><b>Atención:</b> importar reemplaza TODOS los datos actuales por los del archivo. ' +
    'Si no estás seguro, primero guarda una salva de lo actual.</p>' +
    '<input type="file" id="archivo" accept=".json,application/json">' +
    '<div id="previa"></div><div class="error" id="e-importar"></div>' +
    '<button class="btn peligro" id="b-importar" type="button" hidden>Importar y reemplazar todo</button></section>';

  h += '<section class="panel"><h2>Contenido actual de la base de datos</h2><div id="actual"></div></section>';
  cont.innerHTML = h;

  function tabla(lista) {
    if (!lista.length) return '<p class="suave">Vacía.</p>';
    return '<div class="tabla-caja"><table><thead><tr><th>Datos</th><th>Registros</th></tr></thead><tbody>' +
      lista.map(r => "<tr><td>" + esc(r.coleccion) + "</td><td>" + r.cantidad + "</td></tr>").join("") + "</tbody></table></div>";
  }
  cont.querySelector("#actual").innerHTML = tabla(BD.resumen(BD.exportar().datos));

  cont.querySelector("#b-guardar").addEventListener("click", function () {
    var n = BD.descargar();
    cont.querySelector("#o-guardar").textContent = "Salva guardada: " + n;
  });

  var pendiente = null, err = cont.querySelector("#e-importar"), btn = cont.querySelector("#b-importar");
  cont.querySelector("#archivo").addEventListener("change", function (ev) {
    pendiente = null; btn.hidden = true; err.textContent = ""; cont.querySelector("#previa").innerHTML = "";
    var f = ev.target.files[0];
    if (!f) return;
    var lector = new FileReader();
    lector.onload = function () {
      var r = BD.revisar(String(lector.result));
      if (!r.ok) { err.textContent = r.error; return; }
      pendiente = r.salva;
      var fecha = r.fecha ? new Date(r.fecha).toLocaleString("es") : "sin fecha";
      cont.querySelector("#previa").innerHTML = '<p>Salva del <b>' + esc(fecha) + "</b> con:</p>" + tabla(r.resumen);
      btn.hidden = false;
    };
    lector.onerror = function () { err.textContent = "No se pudo leer el archivo."; };
    lector.readAsText(f);
  });

  btn.addEventListener("click", function () {
    if (!pendiente) return;
    if (!confirm("Esto reemplaza TODOS los datos actuales por los de la salva. ¿Continuar?")) return;
    BD.importar(pendiente).then(function (r) {
      if (!r.ok) { err.textContent = r.error; return; }
      alert("Salva importada. Vuelve a iniciar sesión.");
      Seguridad.cerrarSesion(); location.hash = ""; location.reload();
    });
  });
});
