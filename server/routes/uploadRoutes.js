const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/uploads?purpose=consent-forms|medicines|doctors
// multipart/form-data, field name: "file"
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.status(201).json({
    url: req.file.path,
    publicId: req.file.filename,
  });
});

module.exports = router;
