const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, default: 'default.jpg' },
    email: { type: String, unique: true, required: true },
    role: { type: String, required: true },
    password: { type: String, minlength: 6 },
    isVerified: { type: Boolean, default: true },
    verificationToken: String,
    resetToken: {
        token: String,
        expires: Date
    },
    created: { type: Date, default: Date.now },
    updated: Date
});

module.exports = model('User', userSchema);
