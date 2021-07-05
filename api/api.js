const express = require('express');
const artistsRouter = require('./artists');
const seriesRouter = require('./series');

const apiRouter = express.Router();

// Mount artistsRouter to apiRouter at /api/artists
apiRouter.use('/artists', artistsRouter);

// Mount seriesRouter to apiRouter at /api/series
apiRouter.use('/series', seriesRouter);

module.exports = apiRouter;