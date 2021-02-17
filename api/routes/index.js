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
router.post('/auth/verify-email', AuthController.verifyEmail);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.put('/auth/profile/:id', authorize(), AuthController.updateProfile);
router.put('/auth/password/:id', authorize(), AuthController.updatePassword);
router.post('/auth/avatar/:id', authorize(), AuthController.updateAvatar);

router.get('/users', authorize([Role.Admin]), UserController.getAll);
router.get('/users/:id', authorize([Role.Admin]), UserController.getById);
router.post('/users', authorize([Role.Admin]), UserController.create);
router.delete('/users/:id', authorize([Role.Admin]), UserController.delete);

module.exports = router;