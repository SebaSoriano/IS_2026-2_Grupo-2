import { z } from 'zod';

export const TIPOS_DONACION = ['monetaria', 'insumos'];
export const METODOS_PAGO = ['efectivo', 'transferencia'];
export const ESTADOS_DONACION = ['pendiente', 'agendada', 'confirmada'];
export const ORIGENES_DONACION = ['presencial', 'web'];

const rut = z.string().trim().regex(/^\d{7,8}-[\dkK]$/, 'Debe ser un RUT con formato 12345678-9');

// Campos que comparten el registro presencial y el web
const camposDonacion = {
  tipo_donacion: z.enum(TIPOS_DONACION, { error: `Debe ser uno de: ${TIPOS_DONACION.join(', ')}` }),
  monto_donacion: z.number({ error: 'Debe ser un número' })
    .int('Debe ser un número entero')
    .positive('Debe ser mayor a 0')
    .max(100_000_000, 'El monto es demasiado alto')
    .optional(),
  metodo_pago: z.enum(METODOS_PAGO, { error: `Debe ser uno de: ${METODOS_PAGO.join(', ')}` }).optional(),
  comprobante_url: z.url('Debe ser una URL válida').max(255).optional(),
  descripcion_insumos: z.string().trim().min(1, 'No puede estar vacío').max(500).optional(),
};

// Reglas que dependen del tipo: una monetaria necesita monto y método, una de insumos necesita descripción
const reglasPorTipo = (datos, ctx) => {
  const error = (campo, message) => ctx.addIssue({ code: 'custom', path: [campo], message });

  if (datos.tipo_donacion === 'monetaria') {
    if (datos.monto_donacion === undefined) error('monto_donacion', 'El monto es obligatorio en donaciones monetarias');
    if (datos.metodo_pago === undefined) error('metodo_pago', 'El método de pago es obligatorio en donaciones monetarias');
    if (datos.descripcion_insumos !== undefined) error('descripcion_insumos', 'Solo aplica a donaciones de insumos');
    if (datos.comprobante_url !== undefined && datos.metodo_pago !== 'transferencia') {
      error('comprobante_url', 'El comprobante solo aplica a transferencias');
    }
  } else {
    if (datos.descripcion_insumos === undefined) error('descripcion_insumos', 'Describe los insumos donados');
    for (const campo of ['monto_donacion', 'metodo_pago', 'comprobante_url']) {
      if (datos[campo] !== undefined) error(campo, 'Solo aplica a donaciones monetarias');
    }
  }
};

// POST /api/donaciones (lo registra un voluntario)
export const createDonacionPresencialSchema = z
  .object({
    ...camposDonacion,
    fecha_donacion: z.coerce
      .date({ error: 'Debe ser una fecha válida (AAAA-MM-DD)' })
      .refine((fecha) => fecha <= new Date(), 'La fecha no puede ser futura')
      .optional(),
    rut_usuario: rut,
  })
  .strict()
  .superRefine(reglasPorTipo);

// POST /api/donaciones/web (formulario público del donante)
export const createDonacionWebSchema = z
  .object({
    ...camposDonacion,
    donante_nombre: z.string().trim().min(1, 'No puede estar vacío').max(100),
    donante_correo: z.email('Debe ser un correo válido').max(100),
    donante_telefono: z.string().trim().regex(/^\+?\d{8,14}$/, 'Teléfono inválido').optional(),
  })
  .strict()
  .superRefine(reglasPorTipo);