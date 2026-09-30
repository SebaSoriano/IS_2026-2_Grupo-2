export const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const { errores, datos } = schema(req[target] ?? {});

        if (errores.length > 0) {
            return res.status(400).json({
                error: "Error de validación de los datos enviados",
                details: errores,
            });
        }

        if (target === 'query'){
            req.validateQuery = datos;
        }
        else{
            req[target] = datos;
        }

        next();
    }
}