const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Consent forms / medicine images / doctor docs — all go into one Cloudinary folder,
// organised by "purpose" query param if provided.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const purpose = req.query.purpose || 'general';
    return {
      folder: `prt-health-app/${purpose}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      resource_type: 'auto',
      public_id: `${purpose}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
