import { z } from 'zod';

// Mensajes de error de Zod en español
z.config(z.locales.es());
// Si el campo no viene en la peticion, se responde "Campo obligatorio"
z.config({
    customError: (issue) =>
        issue.code === 'invalid_type' && issue.input === undefined ? 'Campo obligatorio' : undefined,
});

// Valida req[target] ('body', 'params' o 'query') con un schema de Zod antes de llegar al controller
export const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const resultado = schema.safeParse(req[target] ?? {});

        if (!resultado.success) {
            const errores = resultado.error.issues.map((issue) => ({
                campo: issue.path.join('.') || target,
                mensaje: issue.message,
            }));

            return res.status(400).json({
                error: "Error de validación de los datos enviados",
                details: errores,
            });
        }

        // En Express 5 req.query es de solo lectura, por eso se guarda aparte
        if (target === 'query'){
            req.validateQuery = resultado.data;
        }
        else{
            req[target] = resultado.data;
        }

        next();
    }
}
