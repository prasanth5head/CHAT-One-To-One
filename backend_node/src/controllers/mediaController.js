const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'securechat';
    let resource_type = 'auto';
    if (file.mimetype.startsWith('image')) folder = 'securechat/images';
    else if (file.mimetype.startsWith('audio')) folder = 'securechat/audio';
    
    return {
      folder: folder,
      resource_type: resource_type,
      public_id: Date.now() + '-' + file.originalname.split('.')[0]
    };
  }
});

const upload = multer({ storage: storage });

exports.uploadMedia = [
  upload.single('file'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Upload failed' });
    res.json(req.file.path);
  }
];
