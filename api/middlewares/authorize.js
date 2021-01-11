const User = require('../models/User');
const veriyToken = require('./verify-token');

// Función que recibe un conjunto de roles
function authorize(roles = []) {
    return [
        veriyToken,
        async (req, res, next) => {
            const user = await User.findById(req.user.id);

            if (!user || (roles.length && !roles.includes(user.role))) {
                // El usuario no existe o no tiene el rol necesario
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // autorización exitosa
            req.user.role = user.role;
            next();
        }
    ]
}

module.exports = authorize;