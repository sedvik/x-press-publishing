const express = require('express');
const sqlite3 = require('sqlite3');
const path = require('path');

const db =  new sqlite3.Database(process.env.TEST_DATABASE || path.join(__dirname, '..', 'database.sqlite'));
const issuesRouter = express.Router({mergeParams: true});

const hasCorrectAttributes = (req, res, next) => {
    const issue = req.body.issue;
    const name = issue.name;
    const issueNumber = Number(issue.issueNumber);
    const publicationDate = issue.publicationDate;
    const artistId = Number(issue.artistId);

    if (!(name && issueNumber && publicationDate && artistId)) {
        res.status(400).send();
    } else if (typeof name !== 'string' || typeof issueNumber !== 'number' || typeof publicationDate !== 'string' || typeof artistId !== 'number') {
        res.status(400).send();
    } else {
        return next();
    }
}

// :issueId param extraction
issuesRouter.param('issueId', (req, res, next, id) => {
    db.get("SELECT * FROM Issue WHERE id = $id;",
        {
            $id: id
        },
        (err, row) => {
            if (err) {
                return next(err);
            } else if (row) {
                req.issue = row;
                req.issueId = id;
                next();
            } else {
                res.status(404).send();
            }
        }
    );
});

// GET /api/series/:seriesId/issues
issuesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Issue WHERE series_id = $series_id;",
        {
            $series_id: req.seriesId
        },
        (err, rows) => {
            if (err) {
                return next(err);
            } else {
                res.status(200).json({issues: rows});
            }
        }
    );
});

// POST /api/series/:seriesId/issues
issuesRouter.post('/', hasCorrectAttributes, (req, res, next) => {
    const issue = req.body.issue;
    db.run("INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issue_number, $publication_date, $artist_id, $series_id);",
        {
            $name: issue.name,
            $issue_number: issue.issueNumber,
            $publication_date: issue.publicationDate,
            $artist_id: issue.artistId,
            $series_id: req.seriesId
        },
        function(err) {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Issue WHERE id = $id;",
                {
                    $id: this.lastID
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(201).json({issue: row});
                }
            );
        }
    );
});

// PUT /api/series/:seriesId/issues/:issueId
issuesRouter.put('/:issueId', hasCorrectAttributes, (req, res, next) => {
    const issue = req.body.issue;
    db.run("UPDATE Issue SET name = $name, issue_number = $issue_number, publication_date = $publication_date, artist_id = $artist_id, series_id = $series_id WHERE id = $id;",
        {
            $name: issue.name,
            $issue_number: issue.issueNumber,
            $publication_date: issue.publicationDate,
            $artist_id: issue.artistId,
            $series_id: req.seriesId,
            $id: req.issueId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Issue WHERE id = $id;",
                {
                    $id: req.issueId
                },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).json({issue: row});
                }
            );
        }
    );
});

// DELETE /api/series/:seriesId/issues/:issueId
issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run("DELETE FROM Issue WHERE id = $id;",
        {
            $id: req.issueId
        },
        (err) => {
            if (err) {
                return next(err);
            }
            res.status(204).send();
        }
    );
});


module.exports = issuesRouter;