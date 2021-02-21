const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const looksSame = require('looks-same');
const sharp = require('sharp');
const { unlinkSync } = require('fs');

const TOLERANCE = 200;
const WIDTH = 200;
const BLUEPRINTS = [
  __dirname + '/blueprints/1.gif',
  __dirname + '/blueprints/2.gif',
  __dirname + '/blueprints/3.png',
  __dirname + '/blueprints/4.png',
  __dirname + '/blueprints/5.png',
  __dirname + '/blueprints/6.png',
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const checkBlueprints = async (image, blueprints, callback) => {
  if (blueprints.length === 0) {
    return callback(false);
  }
  const next = blueprints.shift();
  const compare = await sharp(next).resize(WIDTH).toBuffer();
  looksSame(image, compare, { tolerance: TOLERANCE }, (error, info) => {
    if (error || !info) {
      return callback(false);
    }
    const { equal } = info;
    if (equal) {
      return callback(true);
    } else {
      checkBlueprints(image, blueprints, callback);
    }
  });
};

app.post('/', upload.single('file'), async (req, res) => {
  if (req.file) {
    if (req.file.mimetype.indexOf('image') === -1) {
      res.sendFile(__dirname + '/bad.html');
      return;
    }
    const { path } = req.file;
    const image = await sharp(path).resize(200).toBuffer();
    checkBlueprints(image, [...BLUEPRINTS], (equal) => {
      unlinkSync(path);
      res.sendFile(__dirname + (equal ? '/good.html' : '/bad.html'));
    });
  } else {
    res.sendFile(__dirname + '/index.html');
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('listening on 3000');
});
