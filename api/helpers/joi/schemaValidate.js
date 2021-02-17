const joi = require('@hapi/joi');
const { stringMessages } = require('./messages');

const firstName = joi.string().min(2).max(255).required().messages(stringMessages("Los nombres", "os"));
const lastName = joi.string().min(2).max(255).required().messages(stringMessages("Los apellidos", "os"));
const email = joi.string().min(6).max(255).required().email().messages(stringMessages("El correo electrónico"));
const password = joi.string().min(6).max(1024).required().messages(stringMessages("La contraseña", "a"));

const schemaRegister = joi.object({ firstName, lastName, email, password });
const schemaLogin = joi.object({ email, password });
const schemaBasicData = joi.object({ firstName, lastName, email });
const forgotPasswordSchema = joi.object({ email });

const schemaUpdatePassword = joi.object({
    oldPassword: joi.string().min(6).max(1024).required().messages(stringMessages("El campo contraseña actual")),
    newPassword: joi.string().min(6).max(1024).required().messages(stringMessages("El campo nueva contraseña")),
    repeatPassword: joi.string().min(6).max(1024).required().messages(stringMessages("El campo repetir contraseña")),
})
const resetPasswordSchema = joi.object({
    token: joi.string().required().messages(stringMessages("El token")),
    password: joi.string().min(6).max(1024).required().messages(stringMessages("El campo Contraseña")),
    confirmPassword: joi.string().min(6).max(1024).required().messages(stringMessages("El campo Repetir Contraseña")),
});

module.exports = {
    schemaRegister,
    schemaLogin,
    schemaBasicData,
    schemaUpdatePassword,
    forgotPasswordSchema,
    resetPasswordSchema
}