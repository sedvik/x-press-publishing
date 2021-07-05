const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');
const issuesRouter = require('./issues');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const seriesRouter = express.Router();

// middleware for checking that series property in request body has required attributes and are of the correct type
const hasCorrectAttributes = (req, res, next) => {
    const series = req.body.series;
    const name = series.name;
    const description = series.description;

    if (!(name && description)) {
        res.status(400).send();
    } else if (typeof name !== 'string' || typeof description !== 'string') {
        res.status(400).send();
    } else {
        return next();
    }
}

// :seriesId param extraction
seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get("SELECT * FROM Series WHERE id = $id",
        {
            $id: id
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                req.series = row;
                req.seriesId = id;
                return next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/series
seriesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Series;",
        (err, rows) => {
            if (err) {
                return next(err);
            }
            res.status(200).json({ series: rows });
        }
    );
});

// GET /api/series/:seriesId
seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({ series: req.series });
});

// POST /api/series
seriesRouter.post('/', hasCorrectAttributes, (req, res, next) => {
    const series = req.body.series;
    db.run("INSERT INTO Series (name, description) VALUES ($name, $description);",
        {
            $name: series.name,
            $description: series.description
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Series WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({ series: row });
                }
            );
        }
    );
});

// PUT /api/series/:seriesId
seriesRouter.put('/:seriesId', hasCorrectAttributes, (req, res, next) => {
    const series = req.body.series;
    db.run("UPDATE Series SET name = $name, description = $description WHERE id = $id;",
        {
            $name: series.name,
            $description: series.description,
            $id: req.seriesId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Series WHERE id = $id;",
                {
                    $id: req.seriesId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({ series: row });
                }
            );
        }
    );
});

// DELETE /api/series/:seriesId
seriesRouter.delete('/:seriesId', (req, res, next) => {
    // If series has any related issues, return 400 response
    db.get("SELECT * FROM Issue WHERE series_id = $series_id;",
        {
            $series_id: req.seriesId
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                return res.status(400).send();
            }
            db.run("DELETE FROM Series WHERE id = $id;",
                {
                    $id: req.seriesId
                },
                (err) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(204).send();
                }
            );
        }   
    );
});

// Mount /api/series/:seriesId/issues routes
seriesRouter.use('/:seriesId/issues', issuesRouter);

module.exports = seriesRouter;
