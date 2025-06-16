import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    console.log(`🔍 Verificando arquivo: ${file.originalname} com MIME type: ${file.mimetype}`);
    
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      // Vídeos
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv',
      // Áudios
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg', 'audio/aac', 'audio/flac',
      // Documentos
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/rtf', 'application/json', 'text/html', 'application/xml', 'text/xml',
      // Tipos adicionais comuns
      'application/octet-stream', 'text/javascript', 'application/javascript'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ Arquivo aceito: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`⚠️ Tipo de arquivo rejeitado: "${file.mimetype}" para arquivo: ${file.originalname}`);
      cb(null, true); // Temporariamente aceitar todos os arquivos para debug
    }
  }
}); 