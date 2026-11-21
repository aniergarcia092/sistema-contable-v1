// ============================================================
// MÓDULO: CONFIGURACIÓN
// Muestra los 5 botones. Cada botón lleva a su sub-pantalla.
// Una sub-pantalla hecha se registra con Sistema.registrarSub("configuracion", "nombre", fn)
// ============================================================
Sistema.registrar("configuracion", function (cont, sub) {
  var boton = sub && CONFIG_BOTONES.find(b => b.id === sub);
  if (boton) {
    var hecha = Sistema.subs["configuracion/" + sub];
    if (hecha) { hecha(cont, boton); return; }
    Sistema.enConstruccion(cont, ["Configuración", boton.titulo]);
    var volver = document.createElement("a");
    volver.className = "volver";
    volver.href = "#configuracion";
    volver.textContent = "← Volver a Configuración";
    cont.appendChild(volver);
    return;
  }

  cont.innerHTML = '<p class="ruta">Estás en: Configuración</p><h1>Configuración</h1>' +
                   '<div class="rejilla" id="rej"></div>';
  var rej = cont.querySelector("#rej");
  CONFIG_BOTONES.forEach(function (b) {
    var a = document.createElement("a");
    a.className = "tarjeta-boton";
    a.href = "#configuracion/" + b.id;
    a.innerHTML = '<span class="cabeza"><span class="icono-caja">' + icono(b.id) + '</span><span class="flecha">→</span></span><span class="t"></span><span class="d"></span>';
    a.querySelector(".t").textContent = b.titulo;
    a.querySelector(".d").textContent = b.detalle;
    rej.appendChild(a);
  });
});
