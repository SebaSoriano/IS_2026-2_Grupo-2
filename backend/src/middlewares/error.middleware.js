import { Prisma } from '@prisma/client';
import multer from 'multer';

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El JSON enviado está mal formado.' });
    }

    //Errores a proposito desde services/controllers
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    //Errores de multer al subir archivos
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'La foto no puede pesar más de 3 MB' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Debe enviar una sola foto en el campo "foto"' });
        }
        return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
    }

    //JSON mal formado en el body (lo lanza express.json())
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la peticion no es un JSON valido' });
    }

    //Errores de Prisma (base de datos)
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: `Ya existe un registro con el mismo valor en: ${err.meta?.target}`,
        });
    }
    if (err.code === 'P2003'){
        return res.status(400).json({
            error: 'La relacion indicada no es valida (el registro referenciado no existe en la tabla relacionada)',
        });
    }
    if (err.code === 'P2025'){
        return res.status(404).json({ error: 'El recurso solicitado no existe (no se encontro el registro en la base de datos)' });
    }

    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
}
