const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + Math.floor(Math.random() * 10000) + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const imageUploadMiddleware = upload.array('images', 16); // 'images' is the name attribute of the file input, 16 is the max number of files
const imageUploadMiddlewareWithBackground = upload.array('images', 18);

const imagesUploader = (req, res, next) => {
  imageUploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err.message)
      return res.status(400).send('File upload error: ' + err.message);
    } else if (err) {
      return res.status(500).send(err.message);
    }

    // Extract additional information from the uploaded files and add it to the request body
    req.body.images = req.files.map((file) => (file.filename));
    req.files = []

    next();
  });
};

const imageUploaderWithBackground = (req, res, next) => {

  imageUploadMiddlewareWithBackground(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err.message)
      return res.status(400).send('File upload error: ' + err.message);
    } else if (err) {
      return res.status(500).send(err.message);
    }

    // Extract additional information from the uploaded files and add it to the request body
    const images =  req.files.map((file) => (file.filename));;
    req.file = {}

    if (req.body.backgroundImageToogle === 'false' && req.body.cardBackgroundImageToogle === 'false' ) {
      req.body.backgroundImage = 'default-background.svg';
      req.body.cardBackgroundImage = 'default-card-background.svg'
      req.body.images = images
    } else if (req.body.backgroundImageToogle === 'false' && req.body.cardBackgroundImageToogle === 'true' ) {
      req.body.backgroundImage = 'default-background.svg';
      req.body.cardBackgroundImage = images[images.length - 1]
      req.body.images = images.slice(0, -1)
    } else if (req.body.backgroundImageToogle === 'true' && req.body.cardBackgroundImageToogle === 'false' ) {
      req.body.cardBackgroundImage = 'default-card-background.svg';
      req.body.backgroundImage = images[images.length - 1]
      req.body.images = images.slice(0, -1)
    } else if (req.body.backgroundImageToogle === 'true' && req.body.cardBackgroundImageToogle === 'true' ) {
      req.body.cardBackgroundImage = images[images.length - 2]
      req.body.backgroundImage = images[images.length - 1]
      req.body.images = images.slice(0, -2)
      console.log(req.body)
    }

    next();

  });
}

module.exports = {
  imagesUploader,
  imageUploaderWithBackground
}