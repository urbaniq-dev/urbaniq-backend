import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';

// Determine upload directory dynamically
const getUploadDir = (req: any) => {
  if (req.originalUrl.includes('/users') || req.originalUrl.includes('/agent-profiles')) {
    return path.join(process.cwd(), 'uploads', 'users');
  }
  return path.join(process.cwd(), 'uploads', 'properties');
};

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = getUploadDir(req);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const prefix = (req.originalUrl.includes('/users') || req.originalUrl.includes('/agent-profiles')) ? 'user' : 'property';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  }
});

// Check file type
function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|webp/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('Error: Images Only!', 400) as any);
  }
}

// Initialize upload
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});
