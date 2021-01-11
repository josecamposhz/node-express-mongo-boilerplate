const User = require('../models/User')

// Retorna todos los usuarios registrados
async function getAll(req, res) {
    const users = await User.find();
    return res.send(users.map(user => basicDetails(user)));
}

// Retorna un usuario en especifico
async function getById(req, res) {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: 'Usuario no encontrado' })
    return res.send(basicDetails(user));
}

// Elimina un usuario
async function deleteUser(req, res) {
    User.findByIdAndDelete(req.params.id)
        .then(() => res.sendStatus(204))
        .catch(error => res.status(400).send({ error }));
}

function basicDetails(user) {
    const { id, firstName, lastName, email, role, created, updated } = user;
    return { id, firstName, lastName, email, role, created, updated };
}

module.exports = {
    getAll,
    getById,
    delete: deleteUser,
    basicDetails,
};