const mongoose = require('mongoose');
global.Promise = mongoose.Promise;
require('./config/config');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const userRouter = require('./routes/user');

const app = express();

require('./db/connection');

app.use(cors());


const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


var swaggerDefinition = {
  info: {
    title: 'POC-HyperLedger',
    version: '1.0.0',
    description: 'Documentation of POC HyperLedger Indy',
  },
  host: `${global.gConfig.swaggerURL}`,
  // host: `172.16.2.248:1948`,

  basePath: '/',
};
var options1 = {
  swaggerDefinition: swaggerDefinition,
  apis: ['./routes/*.js']
};

var swaggerSpec = swaggerJSDoc(options1);


app.get('/swagger.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// initialize swagger-jsdoc
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(morgan('dev'))

app.use('/api/v1/user', userRouter);

app.listen(global.gConfig.port, function () {
  console.log("Server is listening on", global.gConfig.port)
});


module.exports = app;