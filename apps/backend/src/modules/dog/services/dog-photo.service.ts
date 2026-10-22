import 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import convert from 'heic-convert';
import sharp from 'sharp';

export function getUploadsDir(): string {
  if (process.env.UPLOADS_DIR) {
    return path.resolve(process.env.UPLOADS_DIR);
  }
  if (fs.existsSync(path.join(process.cwd(), 'apps/backend'))) {
    return path.join(process.cwd(), 'apps/backend', 'uploads');
  }
  return path.join(process.cwd(), 'uploads');
}

export function getDogUploadsDir(): string {
  return path.join(getUploadsDir(), 'dogs');
}

export const MAX_DOG_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_DOG_PHOTO_PIXELS = 50_000_000; // 50 megapixels (e.g. up to 48MP phone cameras)

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

export function detectImageFormat(
  buffer: Buffer,
): 'jpeg' | 'png' | 'heic' | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // HEIC/HEIF: offset 4 'ftyp'
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.toString('latin1', 8, 12).trim().toLowerCase();
    const allowedBrands = [
      'heic',
      'heix',
      'hevc',
      'hevx',
      'heim',
      'heis',
      'mif1',
      'msf1',
    ];
    if (allowedBrands.includes(brand)) {
      return 'heic';
    }
  }

  return null;
}

export function getHeicDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  if (!buffer || buffer.length < 24) return null;
  const ispeIndex = buffer.indexOf(Buffer.from('ispe'));
  if (ispeIndex === -1 || ispeIndex + 16 > buffer.length) {
    return null;
  }
  const width = buffer.readUInt32BE(ispeIndex + 8);
  const height = buffer.readUInt32BE(ispeIndex + 12);
  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

export async function deleteDogPhotoFile(
  photoUrl?: string | null,
): Promise<void> {
  if (!photoUrl) return;
  try {
    const filename = path.basename(photoUrl.split('?')[0]);
    if (!filename || filename === '.' || filename === '/') return;
    const filePath = path.join(getDogUploadsDir(), filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn(`Nepodařilo se smazat soubor fotky psa: ${photoUrl}`, err);
  }
}

export async function deleteDogPhotoFiles(
  photoUrls: (string | null | undefined)[],
): Promise<void> {
  await Promise.all(photoUrls.map((url) => deleteDogPhotoFile(url)));
}

@Injectable()
export class DogPhotoService {
  private readonly logger = new Logger(DogPhotoService.name);

  async processAndSavePhoto(
    _dogId: string,
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
    const detectedFormat = detectImageFormat(file.buffer);

    if (!detectedFormat || !isAllowedMime || !isAllowedExt) {
      throw new BadRequestException(
        'Nepodporovaný formát souboru. Povolené formáty jsou JPG, PNG a HEIC/HEIF.',
      );
    }

    if (
      (detectedFormat === 'jpeg' &&
        !mime.includes('jpeg') &&
        !['.jpg', '.jpeg'].includes(ext)) ||
      (detectedFormat === 'png' && !mime.includes('png') && ext !== '.png') ||
      (detectedFormat === 'heic' &&
        !mime.includes('heic') &&
        !mime.includes('heif') &&
        !['.heic', '.heif'].includes(ext))
    ) {
      throw new BadRequestException(
        'Obsah souboru neodpovídá deklarovanému typu obrázku.',
      );
    }

    let inputBuffer: Buffer = file.buffer;

    if (detectedFormat === 'heic') {
      const dimensions = getHeicDimensions(file.buffer);
      if (
        dimensions &&
        dimensions.width * dimensions.height > MAX_DOG_PHOTO_PIXELS
      ) {
        throw new BadRequestException(
          'Rozměry obrázku překračují maximální povolený limit.',
        );
      }

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
      webpBuffer = await sharp(inputBuffer, {
        limitInputPixels: MAX_DOG_PHOTO_PIXELS,
      })
        .rotate()
        .resize(500, 500, { fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err) {
      this.logger.error('Chyba při zpracování obrázku', err);
      throw new BadRequestException('Neplatný nebo poškozený soubor obrázku.');
    }

    const filename = `${randomUUID()}.webp`;
    const dogsDir = getDogUploadsDir();
    await fs.promises.mkdir(dogsDir, { recursive: true });
    const targetPath = path.join(dogsDir, filename);
    await fs.promises.writeFile(targetPath, webpBuffer);

    return `/uploads/dogs/${filename}`;
  }

  async deletePhotoFile(photoUrl?: string | null): Promise<void> {
    await deleteDogPhotoFile(photoUrl);
  }

  async deleteDogPhotos(
    photoUrls: (string | null | undefined)[],
  ): Promise<void> {
    await deleteDogPhotoFiles(photoUrls);
  }
}
