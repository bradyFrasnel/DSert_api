// src/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, cb) => {
      const randomName = uuidv4();
      return cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Seules les images sont autorisées!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
