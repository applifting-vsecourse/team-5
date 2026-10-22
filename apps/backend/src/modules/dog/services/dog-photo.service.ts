import 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const convert = require('heic-convert');

export function getUploadsDir(): string {
  if (fs.existsSync(path.join(process.cwd(), 'apps/backend'))) {
    return path.join(process.cwd(), 'apps/backend', 'uploads');
  }
  return path.join(process.cwd(), 'uploads');
}

export function getDogUploadsDir(): string {
  return path.join(getUploadsDir(), 'dogs');
}

export const MAX_DOG_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOG_PHOTO_MIMES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];
export const ALLOWED_DOG_PHOTO_EXTS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
];

@Injectable()
export class DogPhotoService {
  private readonly logger = new Logger(DogPhotoService.name);

  async processAndSavePhoto(
    dogId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Soubor nebyl poskytnut.');
    }

    if (
      file.size > MAX_DOG_PHOTO_SIZE ||
      file.buffer.length > MAX_DOG_PHOTO_SIZE
    ) {
      throw new BadRequestException(
        'Soubor je příliš velký. Maximální povolená velikost je 10 MB.',
      );
    }

    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();

    const isAllowedMime = ALLOWED_DOG_PHOTO_MIMES.includes(mime);
    const isAllowedExt = ALLOWED_DOG_PHOTO_EXTS.includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      throw new BadRequestException(
        'Nepodporovaný formát souboru. Povolené formáty jsou JPG, PNG a HEIC/HEIF.',
      );
    }

    let inputBuffer: Buffer = file.buffer;
    const isHeic =
      mime === 'image/heic' ||
      mime === 'image/heif' ||
      ext === '.heic' ||
      ext === '.heif';

    if (isHeic) {
      try {
        const converted = await convert({
          buffer: file.buffer,
          format: 'JPEG',
          quality: 1,
        });
        inputBuffer = Buffer.from(converted);
      } catch (err) {
        this.logger.error('Chyba při převodu HEIC souboru', err);
        throw new BadRequestException('Nepodařilo se zpracovat HEIC obrázek.');
      }
    }

    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(500, 500, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err) {
      this.logger.error('Chyba při zpracování obrázku', err);
      throw new BadRequestException('Neplatný nebo poškozený soubor obrázku.');
    }

    const filename = `${dogId}-${Date.now()}.webp`;
    const dogsDir = getDogUploadsDir();
    await fs.promises.mkdir(dogsDir, { recursive: true });
    const targetPath = path.join(dogsDir, filename);
    await fs.promises.writeFile(targetPath, webpBuffer);

    return `/uploads/dogs/${filename}`;
  }

  async deletePhotoFile(photoUrl?: string | null): Promise<void> {
    if (!photoUrl) return;
    try {
      const filename = path.basename(photoUrl.split('?')[0]);
      if (!filename || filename === '.' || filename === '/') return;
      const filePath = path.join(getDogUploadsDir(), filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      this.logger.warn(
        `Nepodařilo se smazat soubor fotky psa: ${photoUrl}`,
        err,
      );
    }
  }
}
