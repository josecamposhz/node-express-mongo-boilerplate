const User = require('../models/User');
const Role = require('../helpers/role');
const userHelper = require('../helpers/user');
const { schemaBasicData } = require('../helpers/joi/schemaValidate');
const { sendVerificationEmail } = require('../helpers/mail/templates');

// Retorna todos los usuarios registrados
async function getAll(req, res) {
    const users = await User.find();
    return res.send(users.map(user => userHelper.basicDetails(user)));
}

async function create(req, res) {
    try {
        // Validamos que los datos cumplen con la estructura del schemaBasicData
        const { error } = schemaBasicData.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        // Validamos que el email no se encuentra en nuestra base de datos
        const isEmailExist = await User.findOne({ email: req.body.email });
        if (isEmailExist) {
            return res.status(400).json({ error: 'Email ya registrado' })
        }

        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            role: req.body.isAdmin ? Role.Admin : Role.User,
            isVerified: false,
            verificationToken: userHelper.randomTokenString(),
        });

        await User.create(newUser);
        // Enviar email de verificacion
        await sendVerificationEmail(newUser, req.get('origin'));

        res.status(201).send('Registro exitoso');

    } catch (error) {
        res.status(400).send({ error });
    }
}

// Retorna un usuario en especifico
async function getById(req, res) {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' })
    return res.send(userHelper.basicDetails(user));
}

// Elimina un usuario
async function deleteUser(req, res) {
    User.findByIdAndDelete(req.params.id)
        .then(() => res.sendStatus(204))
        .catch(error => res.status(400).send({ error }));
}

module.exports = {
    getAll,
    getById,
    create,
    delete: deleteUser,
};