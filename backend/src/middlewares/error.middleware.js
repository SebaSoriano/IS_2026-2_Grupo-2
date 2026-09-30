import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El JSON enviado está mal formado.' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const campos = [].concat(err.meta?.target ?? 'campo único').join(', ');
      return res.status(409).json({ error: `Conflicto: ya existe un registro con el mismo valor para [${campos}].` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'El recurso solicitado no fue encontrado.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'La relación indicada no es válida (clave foránea inexistente o en uso).' });
    }
  }

  return res.status(500).json({ error: 'Error interno del servidor. Por favor intenta más tarde.' });
};