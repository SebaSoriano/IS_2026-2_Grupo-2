import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CARPETA_EMAILS } from '../config/uploads.js';

const LOW_STOCK_THRESHOLD = 5;
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_USER, SMTP_APP_PASSWORD } = process.env;
  if (!SMTP_USER || !SMTP_APP_PASSWORD) {
    throw new Error('Faltan SMTP_USER o SMTP_APP_PASSWORD en la configuración');
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_APP_PASSWORD.replace(/\s/g, ''),
    },
  });

  return transporter;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderTemplate(template, data) {
  const withSections = template.replace(
    /{{#(\w+)}}([\s\S]*?){{\/\1}}/g,
    (_match, key, content) => {
      const value = data[key];
      if (Array.isArray(value)) {
        return value.map((item) => renderTemplate(content, item)).join('');
      }
      return value ? renderTemplate(content, data) : '';
    },
  );

  return withSections.replace(/{{(\w+)}}/g, (_match, key) => (
    escapeHtml(data[key] ?? '')
  ));
}

async function loadEmailTemplate(fileName, data) {
  const template = await readFile(path.join(CARPETA_EMAILS, fileName), 'utf8');
  return renderTemplate(template, data);
}

function emailLogoAttachment() {
  return {
    filename: 'logo_straypaws.png',
    path: path.join(CARPETA_EMAILS, 'logo_straypaws.png'),
    cid: 'straypaws-logo',
  };
}

export async function sendLowStockNotification(insumo) {
  const recipient = process.env.LOW_STOCK_EMAIL_TO;
  if (!recipient) {
    throw new Error('Falta LOW_STOCK_EMAIL_TO en la configuración');
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: recipient,
    subject: 'Aviso: stock bajo de insumos',
    attachments: [emailLogoAttachment()],
    text: [
      `El insumo "${insumo.tipo_insumo}" tiene stock bajo.`,
      `Cantidad disponible: ${insumo.cantidad}`,
      `ID del insumo: ${insumo.id}`,
      insumo.descripcion ? `Descripción: ${insumo.descripcion}` : null,
    ].filter(Boolean).join('\n'),
    html: await loadEmailTemplate('low-stock.html', {
      preheader: `El stock de ${insumo.tipo_insumo} necesita atención.`,
      nombre: insumo.tipo_insumo,
      cantidad: insumo.cantidad,
      id: insumo.id,
      descripcion: insumo.descripcion,
    }),
  });
}

export async function sendExpiringSuppliesNotification(insumos) {
  const recipient = process.env.LOW_STOCK_EMAIL_TO;
  if (!recipient) {
    throw new Error('Falta LOW_STOCK_EMAIL_TO en la configuración');
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: recipient,
    subject: 'Aviso: insumos próximos a vencer',
    attachments: [emailLogoAttachment()],
    text: [
      'Los siguientes insumos vencen dentro de los próximos 7 días:',
      '',
      ...insumos.flatMap((insumo) => [
        `- "${insumo.tipo_insumo}" (ID: ${insumo.id})`,
        `  Fecha de vencimiento: ${insumo.fecha_vencimiento.toISOString().slice(0, 10)}`,
        `  Cantidad disponible: ${insumo.cantidad}`,
        insumo.descripcion ? `  Descripción: ${insumo.descripcion}` : null,
      ].filter(Boolean)),
    ].join('\n'),
    html: await loadEmailTemplate('expiring-supplies.html', {
      preheader: `${insumos.length} insumo(s) vencen dentro de los próximos 7 días.`,
      insumos: insumos.map((insumo) => ({
        nombre: insumo.tipo_insumo,
        id: insumo.id,
        vencimiento: insumo.fecha_vencimiento.toISOString().slice(0, 10),
        cantidad: insumo.cantidad,
        descripcion: insumo.descripcion,
      })),
    }),
  });
}

export function isLowStock(cantidad) {
  return cantidad <= LOW_STOCK_THRESHOLD;
}

const formatoPesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });
const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' });

// Aviso al donante de que su transferencia (hecha por la web) ya fue recibida
export async function sendDonacionConfirmadaNotification(donacion) {
  const monto = formatoPesos.format(donacion.monto_donacion);
  const fecha = formatoFecha.format(donacion.fecha_donacion);
  const nombre = donacion.donante_nombre || 'donante';

  await getTransporter().sendMail({
    from: `"StrayPaws" <${process.env.SMTP_USER}>`,
    to: donacion.donante_correo,
    subject: '¡Recibimos tu donación! Gracias por apoyar a StrayPaws',
    attachments: [emailLogoAttachment()],
    text: [
      `Hola ${nombre},`,
      '',
      `Te confirmamos que recibimos tu transferencia de ${monto} realizada el ${fecha}.`,
      donacion.cuenta ? `Cuenta de destino: ${donacion.cuenta.banco} · ${donacion.cuenta.titular_nombre}` : null,
      '',
      'Gracias por ayudarnos a cuidar a los animales del refugio.',
      'Equipo StrayPaws',
    ].filter((linea) => linea !== null).join('\n'),
    html: await loadEmailTemplate('donation-confirmed.html', {
      preheader: `Recibimos tu donación de ${monto}. ¡Gracias!`,
      nombre,
      monto,
      fecha,
      banco: donacion.cuenta?.banco,
      titular: donacion.cuenta?.titular_nombre,
    }),
  });
}

// fecha_agendada se guarda como el día a las 00:00 UTC, por eso se formatea en UTC
const formatoFechaLarga = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// Aviso al donante de insumos cuando un voluntario agenda la entrega
export async function sendDonationScheduledNotification(donacion) {
  if (!donacion.donante_correo) return; // sin correo no hay a quién avisar

  const fecha = formatoFechaLarga.format(donacion.fecha_agendada);
  const nombre = donacion.donante_nombre ?? 'donante';
  const direccion = process.env.REFUGIO_DIRECCION; // opcional

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: donacion.donante_correo,
    subject: 'Tu donación de insumos quedó agendada',
    attachments: [emailLogoAttachment()],
    text: [
      `Hola ${nombre}, ¡gracias por tu donación!`,
      `Agendamos la entrega de tus insumos para el ${fecha}.`,
      `Insumos: ${donacion.descripcion_insumos}`,
      direccion ? `Dirección: ${direccion}` : null,
      'Si necesitas cambiar la fecha, responde a este correo.',
    ].filter(Boolean).join('\n'),
    html: await loadEmailTemplate('donation-scheduled.html', {
      preheader: `Entrega agendada para el ${fecha}.`,
      nombre,
      fecha,
      insumos: donacion.descripcion_insumos,
      direccion,
    }),
  });
}