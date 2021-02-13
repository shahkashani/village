const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');

const looksSame = require('looks-same');
const sharp = require('sharp');

app.use(bodyParser.urlencoded({ extended: true }));

const BLUEPRINT1 = __dirname + '/sauce.gif';
const BLUEPRINT2 = __dirname + '/sauce.png';
const BLUEPRINT3 = __dirname + '/sauce2.png';
const TOLERANCE = 200;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

var upload = multer({ storage: storage });

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/', upload.single('picture'), async (req, res) => {
  if (req.file) {
    const image1 = await sharp(req.file.path).resize(200).toBuffer();
    const image2 = await sharp(BLUEPRINT1).resize(200).toBuffer();
    const image3 = await sharp(BLUEPRINT2).resize(200).toBuffer();
    const image4 = await sharp(BLUEPRINT3).resize(200).toBuffer();
    looksSame(
      image1,
      image2,
      { tolerance: TOLERANCE },
      function (error, { equal }) {
        if (equal) {
          res.sendFile(__dirname + '/good.html');
        } else {
          looksSame(
            image1,
            image3,
            { tolerance: TOLERANCE },
            function (error, { equal }) {
              if (equal) {
                res.sendFile(__dirname + '/good.html');
              } else {
                looksSame(
                  image1,
                  image4,
                  { tolerance: TOLERANCE },
                  function (error, { equal }) {
                    if (equal) {
                      res.sendFile(__dirname + '/good.html');
                    } else {
                      res.sendFile(__dirname + '/bad.html');
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } else {
    res.sendFile(__dirname + '/index.html');
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('listening on 3000');
});
