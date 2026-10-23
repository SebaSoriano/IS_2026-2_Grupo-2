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

  import { tipoInsumo } from './insumos.schema.js';

// Los insumos recibidos se agregan al registro de insumos
const insumoDonado = z.object({
  tipo_insumo: tipoInsumo,
  cantidad: z.number().int('Debe ser entero').min(1, 'Mínimo 1').max(99, 'Máximo 99'),
  descripcion: z.string().trim().max(255).optional(),
  fecha_vencimiento: z.coerce.date().optional(),
}).strict();

const listaInsumos = z.array(insumoDonado).min(1, 'Indica al menos un insumo').max(30).optional();

// POST /api/donaciones: agrega esta línea dentro del z.object, junto a rut_usuario
//   insumos: listaInsumos,

// GET /api/donaciones?estado=&tipo_donacion=&origen=
export const filtrosDonacionSchema = z.object({
  estado: z.enum(ESTADOS_DONACION).optional(),
  tipo_donacion: z.enum(TIPOS_DONACION).optional(),
  origen: z.enum(ORIGENES_DONACION).optional(),
}).strict();

// PATCH /api/donaciones/:id (el tipo no se puede cambiar: si se equivocó, se borra y se registra de nuevo)
const { tipo_donacion, ...camposEditables } = camposDonacion;
export const updateDonacionSchema = z.object({
  ...camposEditables,
  fecha_donacion: z.coerce.date().refine((f) => f <= new Date(), 'La fecha no puede ser futura'),
  donante_nombre: z.string().trim().min(1).max(100),
  donante_correo: z.email('Correo inválido').max(100),
  donante_telefono: z.string().trim().regex(/^\+?\d{8,14}$/, 'Teléfono inválido'),
}).partial().strict()
  .refine((d) => Object.keys(d).length > 0, 'Debe enviar al menos un campo para modificar');

// PATCH /api/donaciones/:id/agendar
export const agendarDonacionSchema = z.object({
  fecha_agendada: z.coerce.date().refine((f) => f > new Date(), 'La fecha agendada debe ser futura'),
}).strict();

// PATCH /api/donaciones/:id/confirmar
export const confirmarDonacionSchema = z.object({
  rut_usuario: rut,        // voluntario que recibe la donación
  insumos: listaInsumos,   // obligatorio si la donación es de insumos (lo revisa el service)
}).strict();