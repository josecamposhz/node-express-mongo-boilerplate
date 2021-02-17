const crypto = require("crypto");

function basicDetails(user) {
    const { id, firstName, lastName, email, role, avatar, created, updated } = user;
    return { id, firstName, lastName, email, role, avatar, created, updated };
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

module.exports = {
    basicDetails,
    randomTokenString
}