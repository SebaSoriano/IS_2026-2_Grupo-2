import prisma from '../config/prisma.js';
// importando bcrypt desbloqueamos el hash y no trabajamos 
// las contraseñas con texto plano
import bcrypt from "bcryptjs"; // npm install bcrypt
import { firmarToken } from '../utils/jwt.js';
import { HttpError } from '../middlewares/error.middleware.js';
import {
    COOKIE_NAME,
    DURACION_SESION,
    DURACION_RECORDARME,
    opcionesCookie,
} from '../config/auth.js';

// crear cuenta
const register = async (req, res) => {
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

// log in
const login = async (req, res) => {
    // 1. sacamos del body el rut, la contraseña y si marcó "Recordarme"
    const { rut_usuario, contrasena, recordarme } = req.body;

    // comprobamos que el usuario esté en la base de datos buscando su rut
    // se asigna el usuario encontrado a la variable user, sino queda null
    const user = await prisma.usuario.findUnique({ 
        where: { rut_usuario },
        include: { rol: true } // Incluye el rol del usuario en la consulta 
    });

    // si user es null significa que no hay un usuario con ese rut
    // por ende se muestra un error
    if (!user) return res.status(401).json({ error: "Rut o contraseña inválidos" });

    // compara los hash entre los datos recibidos y los guardados en la base de datos
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);

    if(!isPasswordValid) return res.status(401).json({ error: "Rut o contraseña inválidos" });

    // 2. si los datos son correctos se crea el token (JWT) con el rut y el rol.
    // Con "Recordarme" el token dura 7 días; sin él, 8 horas.
    const duracion = recordarme ? DURACION_RECORDARME : DURACION_SESION;
    const token = firmarToken(user, duracion);

    // 3. el token se guarda en una cookie httpOnly.
    // El navegador la guarda solo y la manda en cada petición siguiente a /api,
    // así el front-end no tiene que guardar ni manejar el token.
    // Con "Recordarme" se agrega maxAge: la cookie sobrevive aunque se cierre el navegador.
    // Sin él, la cookie es "de sesión": el navegador la borra al cerrarse.
    res.cookie(COOKIE_NAME, token, {
        ...opcionesCookie,
        ...(recordarme && { maxAge: duracion }),
    });

    // el token NO va en el JSON: solo viaja en la cookie.
    // Al front-end le basta con saber quién inició sesión
    res.status(200).json({
        status: "Success",
        data: {
            user: publicUser(user), // se muestra solo la info pública
        },
    });
};

// cerrar sesión
// El servidor le pide al navegador que borre la cookie del token.
// Se usan las mismas opciones con que se creó (path, sameSite, etc.),
// porque si no coinciden el navegador la trata como otra cookie y no la borra.
// Esta ruta no exige sesión: si la cookie ya no existe o venció, igual responde bien.
const logout = async (req, res) => {
    res.clearCookie(COOKIE_NAME, opcionesCookie);
    res.status(200).json({
        status: "Success",
        message: "Sesión cerrada",
    });
};

// quién soy
// GET /api/auth/me. Pasa antes por requireAuth, que ya verificó el token
// y dejó { rut, rol } en req.usuario.
// El front-end la usa al abrir la intranet para saber si hay una sesión activa
// (no puede leer la cookie por ser httpOnly, así que le pregunta al servidor).
// Se busca al usuario en la base de datos para devolver datos actualizados
// y para cortar la sesión si el usuario fue eliminado después de iniciar sesión.
const me = async (req, res) => {
    const user = await prisma.usuario.findUnique({
        where: { rut_usuario: req.usuario.rut },
        include: { rol: true },
    });

    if (!user) {
        res.clearCookie(COOKIE_NAME, opcionesCookie);
        throw new HttpError(401, 'El usuario de esta sesión ya no existe');
    }

    res.status(200).json({
        status: "Success",
        data: {
            user: publicUser(user),
        },
    });
};

export { login, register, logout, me }