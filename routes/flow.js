var express = require('express'),
    router = express.Router(),
    collection = 'pages',
    MongoDb = require("mongodb"),
    fs = require("fs");


/***************************************************************************************************************
***************************                       GET Functions                      ***************************
***************************************************************************************************************/

// GET the main app page
router.get('/', function(req, res, next) {
    res.render('flow');
});

// GET a specific page by its ID
router.get('/pages/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db;
    db.collection(collection).findById(pageId, function (err, items) {
        res.json(items);
    });
});

// GET all pages where the 'pageName' is not null
router.get('/pages', function(req, res) {
    var pageId = req.params.id,
        db = req.db;
    db.collection(collection).find({ "pageName": { '$exists': true, $ne: null, $ne: '' } }).sort({ "pageName": 1 }).toArray(function (err, items) {
        res.json(items);
    });
});

// GET all available flows
router.get('/flows', function(req, res) {
    var pageId = req.params.id,
        db = req.db;
    db.collection(collection).find({ "flow": { '$exists': true, $ne: null, $ne: '' } }).sort({ "flow": 1 }).toArray(function (err, items) {
        res.json(items);
    });
});




/***************************************************************************************************************
***************************                       PUT Functions                      ***************************
***************************************************************************************************************/

// Update an existing page object
router.put('/pages/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db;
    db.collection(collection).updateById(pageId, req.body, function(err, result){
        res.send(
            (err === null) ? { error: null, object: req.body } : { error: err }
        );
    });
});

// Update a page name
router.put('/pages/names/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db,
        newPageName = req.body.pageName;
    db.collection(collection).updateById(pageId, { '$set': { pageName: newPageName }}, function(err, result){
        res.send(
            (err === null) ? { error: null, object: req.body } : { error: err }
        );
    });
});

// Update a page's links
router.put('/pages/links/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db,
        newLinks = req.body.links;
    db.collection(collection).updateById(pageId, { '$set': { links: newLinks }}, function(err, result){
        res.send(
            (err === null) ? { error: null, object: req.body } : { error: err }
        );
    });
}); 

// Update a page's image
router.put('/pages/images/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db,
        imageDbObj = getImageFromBuffer(req.files.image);
    
    db.collection(collection).updateById(pageId, { '$set': { image: imageDbObj }}, function(err, result){
        res.send(
            (err === null) ? { id: pageId, image: imageDbObj, error: null } : { error: err }
        );
    });

});

// Update a flow name
router.put('/flows/:id', function(req, res) {
    var pageId = req.params.id,
        db = req.db,
        newFlowName = req.body.flowName;
    db.collection(collection).updateById(pageId, { '$set': { flow: newFlowName }}, function(err, result){
        res.send(
            (err === null) ? { error: null, flow: newFlowName } : { error: err }
        );
    });
});




/***************************************************************************************************************
***************************                     POST Functions                       ***************************
***************************************************************************************************************/

// Add a new page object
router.post('/pages', function(req, res) {
    var db = req.db;
    db.collection(collection).insert(req.body, function(err, result){
        var pageId = req.body._id;
        res.send(
            (err === null) ? { id: pageId, error: null } : { id: null, error: err }
        );
    });
});

// Add a name to a page object
router.post('/pages/names', function(req, res) {
    var db = req.db,
        newPageName = req.body.pageName,
        insertObj = {
            pageName: newPageName,
            image: {},
            links: []
        };
    db.collection(collection).insert(insertObj, function(err, result){
        var pageId = insertObj._id;
        res.send(
            (err === null) ? { id: pageId, error: null } : { error: err }
        );
    });
});

// Add an image to a page object
router.post('/pages/images', function(req, res) {
    var db = req.db,
        imageDbObj = getImageFromBuffer(req.files.image);
        insertObj = {
            pageName: '',
            image: imageDbObj,
            links: []
        };
    db.collection(collection).insert(insertObj, function(err, result){
        var pageId = insertObj._id;
        res.send(
            (err === null) ? { id: pageId, image: imageDbObj, error: null } : { id: null, error: err }
        );
    });
});




/***************************************************************************************************************
***************************                     DELETE Functions                     ***************************
***************************************************************************************************************/

// Delete a page
router.delete('/pages/:id', function(req, res) {
    var db = req.db,
        pageId = req.params.id;

    db.collection(collection).removeById(pageId, function(err, result) {
        res.send((result === 1) ? { error: null } : { error: err });
    });
});


// Delete a flow
router.delete('/flows/:id', function(req, res) {
    var db = req.db,
        pageId = req.params.id;

    db.collection(collection).updateById(pageId, { '$unset': { flow: '' }}, function(err, result) {
        res.send((result === 1) ? { error: null } : { error: err });
    });
});



/***************************************************************************************************************
***************************                     Misc. Functions                      ***************************
***************************************************************************************************************/

// Get the image keys and values
function dump(obj) {
    var out = '';
    for(var i in obj) {
        out += i + ": " + obj[i] + "\n";
    }
    return out;
}

// Get an image object from an image upload
function getImageFromBuffer(imageObj){
    if (imageObj) {
        var data = imageObj.buffer;
        var imageDbObj = {
            image: new MongoDb.Binary(data),
            type: imageObj.mimetype
        };
        return imageDbObj;
    }else{
        return null;
    }
}

module.exports = router;