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

const imageUploadMiddleware = upload.array('images', 16); // 'images' is the name attribute of the file input, 5 is the max number of files

module.exports = (req, res, next) => {
  imageUploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).send('File upload error: ' + err.message);
    } else if (err) {
      return res.status(500).send(err.message);
    }

    // Extract additional information from the uploaded files and add it to the request body
    req.body.images = req.files.map((file) => (file.filename));

    next();
  });
};
