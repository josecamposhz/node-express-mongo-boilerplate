const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../helpers/role');
const userHelper = require('../helpers/user');
const { sendPasswordResetEmail } = require('../helpers/mail/templates');
const { schemaRegister, schemaLogin, schemaBasicData, schemaUpdatePassword, forgotPasswordSchema, resetPasswordSchema } = require('../helpers/joi/schemaValidate');

async function register(req, res) {
    // Validamos que los datos cumplen con la estructura del schemaRegister
    const { error } = schemaRegister.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Validamos que el email no se encuentra en nuestra base de datos
    const isEmailExist = await User.findOne({ email: req.body.email });
    if (isEmailExist) {
        return res.status(400).json({ error: 'Email ya registrado' })
    }

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: password,
    })

    // El primer usuario que se registre tendra el rol de Admin
    const isFirstuser = (await User.countDocuments({})) === 0;
    newUser.role = isFirstuser ? Role.Admin : Role.User;

    User.create(newUser).then(() => {
        res.status(201).send('Registro exitoso');
    }).catch(error => {
        res.status(400).send({ error });
    })

}

async function login(req, res) {
    // Validamos los datos
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Buscamos el usuario en la base de datos
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!user.isVerified) return res.status(400).json({ error: 'Revisa tu correo electrónico para verificar tu cuenta' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Se crea el token
    const token = jwt.sign({
        id: user._id
    }, process.env.TOKEN_SECRET);

    res.json({ user: userHelper.basicDetails(user), token });
}

async function updateProfile(req, res) {
    // Validamos que los datos cumplen con la estructura
    const { firstName, lastName, email } = req.body;
    const { error } = schemaBasicData.validate({ firstName, lastName, email });
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario del request (el cual obtenemos del middleware)
    const user = req.user;
    // Validamos que el email no se encuentra en nuestra base de datos
    if (user.email !== email && await User.findOne({ email })) {
        return res.status(400).json({ error: 'Email ya registrado' })
    }

    // Copiamos los parámetros al usuario y guardamos
    Object.assign(user, { firstName, lastName, email, updated: Date.now() });
    await user.save();

    return res.json({ user: userHelper.basicDetails(user) });
}

async function updatePassword(req, res) {
    // Validamos que los datos cumplen con la estructura
    const { oldPassword, newPassword, repeatPassword } = req.body;
    const { error } = schemaUpdatePassword.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Obtenemos el usuario que esta realizando la request (se obtiene del middleware authorize)
    const currentUser = req.user;
    const validPassword = await bcrypt.compare(oldPassword, currentUser.password);
    if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
    if (newPassword !== repeatPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(newPassword, salt);

    // copy params to user and save
    currentUser.password = password;
    currentUser.updated = Date.now();
    await currentUser.save();

    res.json({ user: userHelper.basicDetails(currentUser) });
}

async function updateAvatar(req, res) {
    try {
        if (!req.files) {
            res.status(400).send({ error: 'No files uploaded' });
        } else {
            // Obtenemos el usuario que esta realizando la request (se obtiene del middleware authorize)
            const currentUser = req.user;

            // Guardamos el archivo en la variable avatar
            const avatar = req.files.avatar;

            // Eliminamos la imagen anterior (En caso de que no sea la por defecto)
            // A su vez validamos que exista la imagen
            if (currentUser.avatar !== 'default.jpg' && fs.existsSync(currentUser.avatar)) {
                fs.unlinkSync('api/public/avatar/' + currentUser.avatar)
            }

            // Usamos el metodo mv() para mover el archivo al directorio pubic/avatar
            // Utilizamos el id único del usuario para evitar conflictos con los nombres al subir un archivo
            avatar.mv('./api/public/avatar/' + currentUser._id + avatar.name);

            // Actualizamos el usuario y guardarmos
            currentUser.avatar = currentUser._id + avatar.name;
            currentUser.updated = Date.now();
            await currentUser.save();

            res.json({ user: userHelper.basicDetails(currentUser) });
        }
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function verifyEmail(req, res) {
    const { token, password, confirmPassword } = req.body;
    const { error } = resetPasswordSchema.validate({ token, password, confirmPassword });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Token inválido' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

    // Encriptamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const userPassword = await bcrypt.hash(password, salt);

    user.isVerified = true;
    user.password = userPassword;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Verificación éxitosa, ahora puedes Iniciar Sesión' });
}

async function forgotPassword(req, res) {
    try {
        const { error } = forgotPasswordSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });
        // Buscamos el usuario en la base de datos
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        // Creamos un token para resetear la contraseña que expira en 24 horas
        user.resetToken = {
            token: userHelper.randomTokenString(),
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        await user.save();

        // Enviar correo con la información
        await sendPasswordResetEmail(user, req.get('origin'));

        res.json({ message: 'Por favor, revisa tu correo electrónico para ver las instrucciones a seguir para restablecer la contraseña' });
    } catch (error) {
        res.status(400).json({ error });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, password, confirmPassword } = req.body;
        const { error } = resetPasswordSchema.validate({ token, password, confirmPassword });
        if (error) return res.status(400).json({ error: error.details[0].message });
        if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no son identicas' });

        // Buscamos el usuario en la base de datos
        // $gt - greater than - mayor que
        const currentUser = await User.findOne({
            'resetToken.token': token, // Buscamos el token
            'resetToken.expires': { $gt: Date.now() } // Comprobamos que la fecha de expiración del token es mayor que la fecha actual
        });
        if (!currentUser) return res.status(400).json({ error: 'Token inválido' });

        // Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password, salt);

        // Actualizamos los parámetros y guardamos
        currentUser.password = newPassword;
        currentUser.updated = Date.now();
        await currentUser.save();

        res.json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        res.status(400).json({ error });
    }
}

module.exports = {
    register,
    login,
    updateProfile,
    updatePassword,
    updateAvatar,
    verifyEmail,
    forgotPassword,
    resetPassword
};