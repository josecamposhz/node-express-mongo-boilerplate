const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { dbConnection } = require('./database/config');
const cors = require('cors');
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json
app.use(fileUpload()); // enable files upload
// Docs express-fileupload library
// https://www.npmjs.com/package/express-fileupload
// https://attacomsian.com/blog/uploading-files-nodejs-express

// Connection to mongoDB
dbConnection();

// Settings
app.set('port', process.env.PORT || 3000);

// Routes
app.use('/api', require('./routes'));

// Archivos públicos
app.use('/static', express.static(__dirname + '/public'));

app.listen(app.get('port'), function () {
    console.log(`App running at port: http://localhost:${app.get('port')}`);
});

module.exports = app