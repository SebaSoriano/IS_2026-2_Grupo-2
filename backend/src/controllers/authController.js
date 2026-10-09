import prisma from '../config/prisma.js';
// importando bcrypt desbloqueamos el hash y no trabajamos 
// las contraseñas con texto plano
import bcrypt from "bcryptjs"; // npm install bcrypt

// crear cuenta
const register = async (req, res) => {
    // TODO
    const { 
        rut_usuario, 
        nombre_usuario,
        correo, 
        telefono,
        fecha_nacimiento,
        contrasena,
        rol_id }  = req.body;
    
    // Se encripta la contraseña con hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Se revisa si el rut tiene un correo registrado
    //const existingUserByRut = await prisma.usuario.findUnique({ where: { rut_usuario } });
    //if (existingUserByRut) {
    //    return res.status(400).json({ error: "Rut ya está registrado" });
    //}
    //const existingUser = await prisma.usuario.findUnique({ where: { correo } });
    //if (existingUser) {
    //    return res.status(400).json({ error: "Correo ya está registrado" });
    //}
    // Se crea el usuario en la base de datos con el correo y la contraseña encriptada
    const newUser = await prisma.usuario.create({
        data: {
            rut_usuario,
            nombre_usuario,
            telefono,
            fecha_nacimiento,
            correo,
            contrasena: hashedPassword,
            rol_id,
        },
    });
    res.status(201).json({
        status: "Success",
        data: {
            user: {
                id: newUser.id,
                rut_usuario: newUser.rut_usuario,
                nombre_usuario: newUser.nombre_usuario,
                telefono: newUser.telefono,
                fecha_nacimiento: newUser.fecha_nacimiento,
                correo: newUser.correo,
                rol_id: newUser.rol_id,
            },
        },
    });
};


// Función para devolver solo los datos públicos del usuario
// Esto es útil para no exponer información sensible 
// como la contraseña
const publicUser = (user) => ({
    rut: user.rut_usuario,
    nombre: user.nombre_usuario,
    correo: user.correo,
    rol: user.rol.nombre,
});

// Cambiar en el apartado LOGIN las variables de user,
// email y id, por usuario, correo y rut_usuario
// log in
const login = async (req, res) => {
    // 1. sacamos del body solo el email y la contraseña
    const { rut_usuario, contrasena } = req.body;

    // comprobamos que el usuario esté en la base de datos comparando su email
    // se asigna el usuario encontrado a la variable user, sino queda null
    const user = await prisma.usuario.findUnique({ 
        where: { rut_usuario },
        include: { rol: true } // Incluye el rol del usuario en la consulta 
    });

    // si user es false significa que no hay un usuario con el email
    // por ende se muestra un error
    if (!user) return res.status(401).json({ error: "Rut o contraseña inválidos" });

    // compara los hash entre los datos recibidos y los guardados en la base de datos
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);

    if(!isPasswordValid) return res.status(401).json({ error: "Rut o contraseña inválidos" });


    // al hacer login exitoso, el servidor responde con el id
    // del usuario ingresado y el rut_usuario, para que el 
    // front-end pueda usarlo en la sesión
    res.status(200).json({
        status: "Success",
        data: {
            user: publicUser(user), // se muestra solo la info pública
        },
    });
};

// cerrar sesión
const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({
        status: "success",
        message: "Looged out successfully",
    });
};

export { login, register, logout }