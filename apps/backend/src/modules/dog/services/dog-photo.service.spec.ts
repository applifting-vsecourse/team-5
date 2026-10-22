import 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { DogPhotoService, getDogUploadsDir } from './dog-photo.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

jest.mock('heic-convert', () => {
  return jest.fn().mockImplementation(async () => {
    // Return a dummy 1x1 jpeg buffer
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const s = require('sharp');
    return await s({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });
});

describe('DogPhotoService', () => {
  let service: DogPhotoService;
  const createdFiles: string[] = [];

  beforeEach(() => {
    service = new DogPhotoService();
  });

  afterAll(async () => {
    // Clean up any files created during tests
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
        }
      } catch {
        // ignore
      }
    }
  });

  it('rejects missing or empty file', async () => {
    await expect(
      service.processAndSavePhoto(
        'dog-1',
        null as unknown as Express.Multer.File,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.processAndSavePhoto(
        'dog-1',
        {} as unknown as Express.Multer.File,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects files larger than 10MB', async () => {
    const largeFile = {
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      size: 10 * 1024 * 1024 + 1,
      mimetype: 'image/jpeg',
      originalname: 'large.jpg',
    } as Express.Multer.File;

    await expect(
      service.processAndSavePhoto('dog-1', largeFile),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported file formats', async () => {
    const pdfFile = {
      buffer: Buffer.from('fake-pdf-content'),
      size: 100,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
    } as Express.Multer.File;

    await expect(service.processAndSavePhoto('dog-1', pdfFile)).rejects.toThrow(
      'Nepodporovaný formát souboru. Povolené formáty jsou JPG, PNG a HEIC/HEIF.',
    );
  });

  it('processes and saves a valid JPEG image as 500x500 WebP', async () => {
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 50,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const file = {
      buffer: inputBuffer,
      size: inputBuffer.length,
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
    } as Express.Multer.File;

    const photoUrl = await service.processAndSavePhoto('dog-1', file);

    expect(photoUrl).toMatch(/^\/uploads\/dogs\/dog-1-\d+\.webp$/);

    const filename = path.basename(photoUrl);
    const diskPath = path.join(getDogUploadsDir(), filename);
    createdFiles.push(diskPath);

    expect(fs.existsSync(diskPath)).toBe(true);

    const metadata = await sharp(diskPath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(500);
    expect(metadata.height).toBe(500);
  });

  it('processes and converts a HEIC file', async () => {
    const file = {
      buffer: Buffer.from('mock-heic-data'),
      size: 50,
      mimetype: 'image/heic',
      originalname: 'photo.heic',
    } as Express.Multer.File;

    const photoUrl = await service.processAndSavePhoto('dog-2', file);

    expect(photoUrl).toMatch(/^\/uploads\/dogs\/dog-2-\d+\.webp$/);

    const filename = path.basename(photoUrl);
    const diskPath = path.join(getDogUploadsDir(), filename);
    createdFiles.push(diskPath);

    expect(fs.existsSync(diskPath)).toBe(true);

    const metadata = await sharp(diskPath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(500);
    expect(metadata.height).toBe(500);
  });

  it('deletes photo file from disk if it exists', async () => {
    const dogsDir = getDogUploadsDir();
    await fs.promises.mkdir(dogsDir, { recursive: true });
    const testFile = path.join(dogsDir, 'test-to-delete.webp');
    await fs.promises.writeFile(testFile, 'dummy');

    expect(fs.existsSync(testFile)).toBe(true);

    await service.deletePhotoFile('/uploads/dogs/test-to-delete.webp');

    expect(fs.existsSync(testFile)).toBe(false);
  });

  it('safely handles deletePhotoFile with null, undefined, or missing file', async () => {
    await expect(service.deletePhotoFile(null)).resolves.not.toThrow();
    await expect(service.deletePhotoFile(undefined)).resolves.not.toThrow();
    await expect(
      service.deletePhotoFile('/uploads/dogs/nonexistent.webp'),
    ).resolves.not.toThrow();
  });
});
