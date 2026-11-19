import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { fechaChilena, hoy } from '../utils/fechas.js';
import { textoRepeticion } from '../utils/repeticiones.js';

// Genera los PDF del historial médico con pdfkit.

// Colores de la página web (los mismos de HistorialSection.css), para que el PDF se vea igual
const COLORES = {
  titulo: '#10494b',
  texto: '#173d3e',
  gris: '#536d6e',
  encabezado: '#1f5f61',
  filaPar: '#f0fbfa',
  borde: '#c3eeee',
};

// Logo de Stray Paws (el mismo de la página). Si el archivo no está, el PDF se genera sin logo.
const carpetaDeEsteArchivo = path.dirname(fileURLToPath(import.meta.url));
const RUTA_LOGO = path.join(carpetaDeEsteArchivo, '..', '..', '..', 'frontend', 'public', 'logo_straypaws.png');
const hayLogo = fs.existsSync(RUTA_LOGO);

// Nombres de los procedimientos del registro, con su repetición si tiene.
// Ej: "Desparasitación (repetir cada 1 semana, 4 veces), Control General"
const textoProcedimientos = (registro) =>
  registro.procedimientos
    .map((p) => {
      const repeticion = textoRepeticion(p);
      return repeticion ? `${p.nombre} (${repeticion})` : p.nombre;
    })
    .join(', ');

// Insumos usados con su cantidad, ej: "Salud: Gasas estériles (x2)"
const nombreInsumo = (i) => (i.descripcion ? `${i.tipo_insumo}: ${i.descripcion}` : i.tipo_insumo);
const textoInsumos = (registro) =>
  registro.insumos.length === 0
    ? 'Sin insumos'
    : registro.insumos.map((i) => `${nombreInsumo(i)} (×${i.cantidad})`).join(', ');

// Dibuja el encabezado que va arriba de la primera página: logo, título y subtítulo
const dibujarEncabezado = (doc, titulo, subtitulos) => {
  const { left } = doc.page.margins;
  const arriba = doc.page.margins.top;
  const xTexto = hayLogo ? left + 50 : left;
  if (hayLogo) doc.image(RUTA_LOGO, left, arriba, { width: 40, height: 40 });

  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORES.titulo).text(titulo, xTexto, arriba + 2);
  doc.font('Helvetica').fontSize(9).fillColor(COLORES.gris);
  for (const subtitulo of subtitulos) doc.text(subtitulo, xTexto);

  // deja el cursor (doc.y) un poco más abajo para empezar el contenido
  doc.y = Math.max(doc.y, arriba + 44) + 12;
};

// Escribe "Página 1 de 3" al pie de cada página.
// Para eso el documento se crea con bufferPages: true, que guarda las páginas en memoria
// hasta el final; recién ahí se sabe cuántas páginas hay en total.
const numerarPaginas = (doc) => {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const { left, right, bottom } = doc.page.margins;
    const ancho = doc.page.width - left - right;
    // se baja el margen inferior un momento para poder escribir dentro de él sin que pdfkit cree otra página
    doc.page.margins.bottom = 0;
    doc.font('Helvetica').fontSize(8).fillColor(COLORES.gris)
      .text(`Stray Paws · Página ${i + 1} de ${count}`, left, doc.page.height - bottom + 12, { width: ancho, align: 'center' });
    doc.page.margins.bottom = bottom;
  }
};

// Columnas de la tabla: título y ancho en puntos. Entre todas suman 770,
// el ancho de una hoja A4 horizontal (842) menos los márgenes (36 + 36).
const COLUMNAS = [
  { titulo: 'Animal', ancho: 95, valor: (r) => r.animal.nombre_animal },
  { titulo: 'Procedimientos', ancho: 200, valor: textoProcedimientos },
  { titulo: 'Fecha', ancho: 65, valor: (r) => fechaChilena(r.fecha_tratamiento) },
  { titulo: 'Veterinario', ancho: 115, valor: (r) => r.veterinario },
  { titulo: 'Insumos', ancho: 295, valor: textoInsumos },
];
const RELLENO = 5; // espacio entre el texto y el borde de cada celda

// Dibuja una fila de la tabla en la posición y. Devuelve el alto que ocupó.
// El alto depende de la celda con más texto: heightOfString calcula cuánto mide
// un texto si se escribe dentro de un ancho dado (con saltos de línea automáticos).
const dibujarFila = (doc, textos, y, { encabezado = false, fondo = null } = {}) => {
  const fuente = encabezado ? 'Helvetica-Bold' : 'Helvetica';
  doc.font(fuente).fontSize(9);
  const alto = Math.max(
    ...textos.map((texto, i) => doc.heightOfString(texto, { width: COLUMNAS[i].ancho - RELLENO * 2 })),
  ) + RELLENO * 2;

  const x0 = doc.page.margins.left;
  const anchoTotal = COLUMNAS.reduce((suma, c) => suma + c.ancho, 0);
  if (encabezado) doc.rect(x0, y, anchoTotal, alto).fill(COLORES.encabezado);
  else if (fondo) doc.rect(x0, y, anchoTotal, alto).fill(fondo);

  let x = x0;
  doc.fillColor(encabezado ? '#ffffff' : COLORES.texto);
  textos.forEach((texto, i) => {
    doc.text(texto, x + RELLENO, y + RELLENO, { width: COLUMNAS[i].ancho - RELLENO * 2 });
    x += COLUMNAS[i].ancho;
  });
  // línea fina debajo de la fila
  doc.moveTo(x0, y + alto).lineTo(x0 + anchoTotal, y + alto).lineWidth(0.5).strokeColor(COLORES.borde).stroke();
  return alto;
};

// PDF de la tabla del historial médico, con los mismos filtros que se ven en pantalla.
// - res: la respuesta de Express (el PDF se envía directo al navegador).
// - registros: los registros que coinciden con los filtros (ya con el formato de historial.service.js).
// - descripcionFiltros: textos como 'Animal: "toby"', para que el PDF diga qué se filtró.
// - total: cuántos registros coinciden (puede ser más que los que caben en el PDF).
export const enviarPdfTabla = (res, { registros, descripcionFiltros, total }) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
  doc.pipe(res);

  const subtitulos = [
    `Generado el ${fechaChilena(hoy())} · ${total} ${total === 1 ? 'registro' : 'registros'}`,
    descripcionFiltros.length > 0 ? `Filtros: ${descripcionFiltros.join(' · ')}` : 'Sin filtros: todos los registros',
  ];
  if (registros.length < total) subtitulos.push(`Se incluyen los ${registros.length} registros más recientes.`);
  dibujarEncabezado(doc, 'Historial médico', subtitulos);

  const titulos = COLUMNAS.map((c) => c.titulo);
  // límite de abajo: si una fila no cabe antes de esta altura, se pasa a una página nueva
  const limite = () => doc.page.height - doc.page.margins.bottom;
  let y = doc.y;
  y += dibujarFila(doc, titulos, y, { encabezado: true });

  if (registros.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(COLORES.gris)
      .text('No hay registros médicos que coincidan con los filtros.', doc.page.margins.left, y + 10);
  }

  registros.forEach((registro, posicion) => {
    const textos = COLUMNAS.map((c) => c.valor(registro));
    // se calcula el alto antes de dibujar, para saber si la fila cabe en esta página
    doc.font('Helvetica').fontSize(9);
    const alto = Math.max(...textos.map((t, i) => doc.heightOfString(t, { width: COLUMNAS[i].ancho - RELLENO * 2 }))) + RELLENO * 2;
    if (y + alto > limite()) {
      doc.addPage();
      y = doc.page.margins.top;
      // en cada página nueva se repite el encabezado de la tabla
      y += dibujarFila(doc, titulos, y, { encabezado: true });
    }
    // filas alternadas: una con fondo celeste muy suave y otra blanca, para leer más fácil
    y += dibujarFila(doc, textos, y, { fondo: posicion % 2 === 0 ? COLORES.filaPar : null });
  });

  numerarPaginas(doc);
  doc.end();
};