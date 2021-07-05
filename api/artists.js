const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const db = new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const artistsRouter = express.Router();

// middleware for checking that artist property in request body has required attributes and are of the correct type
const hasCorrectAttributes = (req, res, next) => {
    const artist = req.body.artist;
    const name = artist.name;
    const dateOfBirth = artist.dateOfBirth;
    const biography = artist.biography;

    if (!(name && dateOfBirth && biography)) {
        res.status(400).send();
    } else if (typeof name !== 'string' || typeof dateOfBirth !== 'string' || typeof biography !== 'string') {
        res.status(400).send();
    } else {
        return next();
    }
}

// :artistId param extraction
artistsRouter.param('artistId', (req, res, next, id) => {
    db.get("SELECT * FROM Artist WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => {
            if(err) {
                return next(err);
            } else if (row) {
                req.artist = row;
                req.artistId = id;
                return next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/artists
artistsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Artist WHERE is_currently_employed = 1;",
        (err, rows) => {
            if (err) {
                return next(err);
            } else {
                res.status(200).json({ artists: rows });
            }
        }
    );
});

// GET /api/artists/:artistId
artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

// POST /api/artists/
artistsRouter.post('/', hasCorrectAttributes, (req, res, next) => {
    const artist = req.body.artist;
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

    // Insert new artist into Artist table
    db.run("INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $date_of_birth, $biography, $is_currently_employed);",
        {
            $name: artist.name,
            $date_of_birth: artist.dateOfBirth,
            $biography: artist.biography,
            $is_currently_employed: isCurrentlyEmployed
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Artist WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({ artist: row });
                }
            );
        }
    )
});

// PUT /api/artists/:artistId
artistsRouter.put('/:artistId', hasCorrectAttributes, (req, res, next) => {
    const artist = req.body.artist;
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

    // Update artist in artist table
    db.run("UPDATE Artist SET name = $name, date_of_birth = $date_of_birth, biography = $biography, is_currently_employed = $is_currently_employed WHERE id = $id",
        {
            $id: req.artistId,
            $name: artist.name,
            $date_of_birth: artist.dateOfBirth,
            $biography: artist.biography,
            $is_currently_employed: isCurrentlyEmployed
        },
        (err) => {
            if (err) {
                return next(err);
            }
            // Retrieve newly updated artist
            db.get("SELECT * FROM Artist WHERE id=$id;",
                {
                    $id: req.artistId
                },
                (err, row) => {
                    if(err) {
                        return next(err);
                    }
                    res.status(200).json({ artist: row });
                }
            );
        })
});

// DELETE /api/artists/:artistId - Note: this simply marks the artist as unemployed and does not actually delete them from the db
artistsRouter.delete('/:artistId', (req, res, next) => {
    db.run("UPDATE Artist SET is_currently_employed = 0 WHERE id = $id;",
        {
            $id: req.artistId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Artist WHERE id = $id;",
                {
                    $id: req.artistId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({ artist: row });
                }
            );
        }
    );
});

module.exports = artistsRouter;