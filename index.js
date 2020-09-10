const express = require('express');

const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mongodb = require('mongodb');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({extended:true})); 

let storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'uploads')  // first parameter is error which is null
    },
    filename: function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));  // first parameter is error which is null
    }
});

let upload = multer({
    storage: storage
});

// configuring mongodb

const MongoClient = mongodb.MongoClient;
const url = 'mongodb+srv://guru:Balbasor123@cluster0.lio2n.mongodb.net/<dbname>?retryWrites=true&w=majority'

MongoClient.connect(url, {
    useUnifiedTopology:true,
    useNewUrlParser: true
}, (err, client) => {
    if(err) return console.log(err);

    db = client.db('images');  // the images database is already created manually in the mongodb.

    app.listen(3000, () => {
        console.log("Mongob server listening at 3000");
    });
})

// home route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// upload file route to the upload folder (any type of file)
app.post('/uploadFile', upload.single('myFile'), (req, res, next) => { // myFile is the name we gave in html name.
    const file = req.file;

    if(!file){
        const error = new Error("please select a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(file);
})

// upload multiple files. to the upload folder (any file)
app.post("/uploadMultipleFiles", upload.array('myFiles', 12), (req,res,next) => {
    const files = req.files;
    console.log("<<>>>");
    if(!files){
        console.log("here");
        const error = new Error("please choose file or files to upload");
        error.httpStatusCode = 400;
        return next(error);
    }

    res.send(files);
})

// upload images to the database.
app.post("/uploadPhoto", upload.single('myImage'), (req, res) => {    // 'myImage' is from html name.
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');

    // define a json object for the image.

    let finalImg = {
        contentType: req.file.mimetype,
        path: req.file.path,
        image: new Buffer(encode_image, 'base64')
    };

    // insert the image to the database.
    db.collection('image').insertOne(finalImg,(err, result) => {
        console.log(result);

        if(err) return console.log(err);

        console.log("saved to database");

        // fetching the image from database after saving.

        res.contentType(finalImg.contentType);
        res.send(finalImg.image);

    })
});

app.listen(5001, () => {
    console.log("server is listening on port 5001");
})


// mongodb server at 3000 and 
// and frontend at 5001.