export const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);

        if(!result.success) {
            return res.status(400).json({
                error: "Error de validación de los datos enviados",
                details: result.error.issues.map((issue) => ({
                    campo: issue.path.join('.'),
                    mensaje: issue.message,
                })),
            
            });

        }

        if (target === 'query'){
            req.validateQuery = result.data;
        }
        else{
            req[target] = result.data;
        }

        next();
    }
}