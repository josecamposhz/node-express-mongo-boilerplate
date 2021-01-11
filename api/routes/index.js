const { Router } = require('express');
const router = Router();
const Role = require('../helpers/role');

// Controllers
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');

// Middlewares
const authorize = require('../middlewares/authorize');

// Rutas
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/protected', authorize([Role.User, Role.Admin]), (req, res) => {
    res.send("Ruta protegida");
});

router.get('/users', authorize([Role.Admin]), UserController.getAll);
router.get('/users/:id', authorize([Role.Admin]), UserController.getById);
router.delete('/users/:id', authorize([Role.Admin]), UserController.delete);

module.exports = router;