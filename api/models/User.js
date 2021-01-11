const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    role: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    created: { type: Date, default: Date.now },
    updated: Date
})

module.exports = model('User', userSchema);
