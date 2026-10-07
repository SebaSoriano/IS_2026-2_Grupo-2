import { prisma } from '../config/prisma.js';
// importando bcrypt desbloqueamos el hash y no trabajamos 
// las contraseñas con texto plano
import bcrypt from "bcryptjs"; // npm install bcrypt

// sign up
const register = async (req, res) => {
    // TODO
};


// log in
const login = async (req, res) => {
    // 1. sacamos del body solo el email y la contraseña
    const { email, password } = req.body;

    // comprobamos que el usuario esté en la base de datos comparando su email
    // se asigna el usuario encontrado a la variable user, sino queda null
    const user = await prisma.user.findUnique({ where: { email } });

    // si user es false significa que no hay un usuario con el email
    // por ende se muestra un error
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    // compara los hash entre los datos recibidos y los guardados en la base de datos
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) return res.status(401).json({ error: "Invalid email or password" });


    // al hacer login exitoso, el servidor responde con el id
    // del usuario ingresado y el email
    res.status(201).json({
        status: "Success",
        data: {
            user: {
                id: user.id,
                email: email,            
            },
        },
    });
};