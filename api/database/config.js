const mongoose = require('mongoose');

const dbConnection = () => {
    mongoose.connect(`mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@products.hlljm.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
        .then(() => console.log('Connected database'))
        .catch(e => console.log('DB Error:', e))
}

module.exports = { dbConnection };
