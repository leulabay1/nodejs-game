const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const imageUploadMiddleware = upload.single('image') // 'image' is the name attribute of the file input for a single file upload

module.exports = (req, res, next) => {
  imageUploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).send('File upload error: ' + err.message);
    } else if (err) {
      return res.status(500).send(err.message);
    }

    try {
      // Extract additional information from the uploaded file and add it to the request body
      req.body.image = req.file.filename;
      next();
    } catch (e) {
      return res.status(500).send(e.message);
    }
    
  });
};
