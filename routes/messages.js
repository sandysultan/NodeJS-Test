'use strict';
var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;

/* GET messages listing. */
router.get('/', function (req, res) {
    req.app.locals.db.collection('messages').find({}).toArray(function (err, arr) {
        if (err) throw err;
        res.json(arr);
    });

});

router.get('/:id', function (req, res) {
    const id = new ObjectID(req.params.id);
    req.app.locals.db.collection('messages').findOne({ _id: id }, function (err, result) {
        if (err) throw err;
        res.json(result);
    });

});

router.delete('/:id', function (req, res) {
    const id = new ObjectID(req.params.id);
    req.app.locals.db.collection('messages').deleteOne({ _id: id })
        .then(result => {
            res.json({ status: 'Deleted' })
        })
        .catch(error => console.error(error))
});

module.exports = router;
