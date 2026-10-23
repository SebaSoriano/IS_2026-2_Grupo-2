import nodemailer from 'nodemailer';

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

export async function sendLowStockNotification(insumo) {
  const recipient = process.env.LOW_STOCK_EMAIL_TO;
  if (!recipient) {
    throw new Error('Falta LOW_STOCK_EMAIL_TO en la configuración');
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: recipient,
    subject: 'Aviso: stock bajo de insumos',
    text: [
      `El insumo "${insumo.tipo_insumo}" tiene stock bajo.`,
      `Cantidad disponible: ${insumo.cantidad}`,
      `ID del insumo: ${insumo.id}`,
      insumo.descripcion ? `Descripción: ${insumo.descripcion}` : null,
    ].filter(Boolean).join('\n'),
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
  });
}

export function isLowStock(cantidad) {
  return cantidad <= LOW_STOCK_THRESHOLD;
}
