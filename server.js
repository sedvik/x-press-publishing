const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorhandler = require('errorhandler');
const apiRouter = require('./api/api.js');

const app = express();
const PORT = process.env.PORT || 4000;

// Use body parsing, cors, logging, and error handling middleware
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(errorhandler());

// Mount apiRouter for all /api routes
app.use('/api', apiRouter);


app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}...`);
});

module.exports = app;