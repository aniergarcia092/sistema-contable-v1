// ============================================================
// DATOS DEL MENÚ: aquí se define qué secciones tiene el sistema.
// Para agregar una sección nueva, añade una línea en MENU.
//   id      -> nombre corto, sin espacios ni tildes (va en la dirección #id)
//   titulo  -> lo que se ve en el menú
//   padre   -> id de la sección donde va dentro del menú (opcional)
// Los accesos de cada usuario se eligen entre estas mismas secciones.
// ============================================================
const MENU = [
  { id: "configuracion", titulo: "Configuración" },

  { id: "contabilidad",  titulo: "Contabilidad" },
  { id: "inventario",    titulo: "Inventario",      padre: "contabilidad" },
  { id: "facturacion",   titulo: "Facturación",     padre: "contabilidad" },
  { id: "punto-venta",   titulo: "Punto de venta",  padre: "contabilidad" },
  { id: "activo-fijo",   titulo: "Activo fijo",     padre: "contabilidad" },

  { id: "finanzas",          titulo: "Finanzas" },
  { id: "nomina-salario",    titulo: "Nómina de salario",    padre: "finanzas" },
  { id: "nomina-campesino",  titulo: "Nómina de campesino",  padre: "finanzas" }
];

// Botones de la pantalla de Configuración
const CONFIG_BOTONES = [
  { id: "usuario",   titulo: "Usuario",   detalle: "Usuarios, contraseñas y accesos" },
  { id: "almacenes", titulo: "Almacenes", detalle: "Lista de almacenes" },
  { id: "area",      titulo: "Área",      detalle: "Áreas de trabajo" },
  { id: "unidades",  titulo: "Unidades",  detalle: "Unidades de medida" },
  { id: "salva",     titulo: "Salva",     detalle: "Copia de seguridad" }
];
