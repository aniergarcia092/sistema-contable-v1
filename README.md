# Sistema Contable LSA

Sistema contable (usuarios, contabilidad, finanzas…) que corre 100 % en el navegador,
sin servidor. Funciona en computadora y en celular, y se puede instalar como app.

## Cómo está organizado
Ver `LEEME.txt`. Resumen: `index.html` (entrada), `css/`, `js/` (motor, base de datos,
seguridad) y `js/modulos/` (un archivo por sección).

## Los datos NO están en GitHub
Los datos se guardan en el navegador de cada dispositivo (IndexedDB). El repositorio solo
tiene el programa. Para pasar datos de un equipo a otro usa **Configuración › Salva**
(guardar salva en uno, importar en el otro).

> Nunca subas archivos `salva-*.json` al repositorio (ya están en `.gitignore`):
> contienen los usuarios y todos los datos.

## Publicar en GitHub Pages (para abrirlo desde el celular)
1. Sube este proyecto a un repositorio de GitHub (la carpeta del proyecto = raíz del repo).
2. En GitHub: **Settings › Pages › Build and deployment › Deploy from a branch**,
   rama `main`, carpeta `/ (root)`, **Save**.
3. Espera 1–2 minutos. Tu dirección será `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. En el celular ábrela y usa **Agregar a pantalla de inicio** (Chrome: menú ⋮ › *Instalar app*;
   iPhone/Safari: Compartir › *Agregar a inicio*).

Nota: GitHub Pages en repositorios privados requiere plan de pago. Con repositorio público
cualquiera puede ver el código (no los datos).
