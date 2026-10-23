import { getInsumosVencenEntre } from './insumo.service.js';
import { sendExpiringSuppliesNotification } from './email.service.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const WARNING_DAYS = 7;

function getExpirationWindow() {
  const now = new Date();
  const startDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  ));
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + WARNING_DAYS + 1);

  return { startDate, endDate };
}

async function notifyExpiringSupplies() {
  const { startDate, endDate } = getExpirationWindow();
  const insumos = await getInsumosVencenEntre(startDate, endDate);

  if (insumos.length > 0) {
    await sendExpiringSuppliesNotification(insumos);
  }
}

export function startExpirationNotifications() {
  const runDailyCheck = async () => {
    try {
      await notifyExpiringSupplies();
    } catch (error) {
      console.error('No se pudo enviar el aviso de insumos próximos a vencer:', error);
    }

    setTimeout(runDailyCheck, DAY_IN_MILLISECONDS);
  };

  void runDailyCheck();
}
