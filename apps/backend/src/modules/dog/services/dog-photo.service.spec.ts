import 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { DogPhotoService, getDogUploadsDir } from './dog-photo.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

jest.mock('heic-convert', () => {
  return jest.fn().mockImplementation(async () => {
    // Return a dummy 10x10 jpeg buffer
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

const createHeicBuffer = (width = 100, height = 100): Buffer => {
  const buf = Buffer.alloc(48);
  buf.writeUInt32BE(24, 0);
  buf.write('ftyp', 4, 'ascii');
  buf.write('heic', 8, 'ascii');
  // Write an ispe box: 4 bytes size (20), 4 bytes 'ispe', 4 bytes version+flags (0), 4 bytes width, 4 bytes height
  buf.writeUInt32BE(20, 24);
  buf.write('ispe', 28, 'ascii');
  buf.writeUInt32BE(0, 32);
  buf.writeUInt32BE(width, 36);
  buf.writeUInt32BE(height, 40);
  return buf;
};

describe('DogPhotoService', () => {
  let service: DogPhotoService;
  const createdFiles: string[] = [];

  beforeEach(() => {
    service = new DogPhotoService();
  });

  afterAll(async () => {
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

  it.each(['', 'application/octet-stream'])(
    'accepts a valid phone photo with generic MIME %s',
    async (mimetype) => {
      const buffer = await sharp({
        create: { width: 12, height: 12, channels: 3, background: 'white' },
      })
        .jpeg()
        .toBuffer();
      const url = await service.processAndSavePhoto('phone-dog', {
        buffer,
        size: buffer.length,
        mimetype,
        originalname: 'phone.jpg',
      } as Express.Multer.File);
      const file = path.join(getDogUploadsDir(), path.basename(url));
      createdFiles.push(file);
      expect((await sharp(file).metadata()).format).toBe('webp');
    },
  );

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

  it('rejects unsupported file formats by mime or extension', async () => {
    const pdfFile = {
      buffer: Buffer.from('fake-pdf-content-longer-than-twelve-bytes'),
      size: 100,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
    } as Express.Multer.File;

    await expect(service.processAndSavePhoto('dog-1', pdfFile)).rejects.toThrow(
      'Nepodporovaný formát souboru. Povolené formáty jsou JPG, PNG a HEIC/HEIF.',
    );
  });

  it('rejects files with allowed extension but invalid magic bytes (fake jpg)', async () => {
    const fakeJpg = {
      buffer: Buffer.from(
        'this is just plain text content masquerading as a jpeg',
      ),
      size: 50,
      mimetype: 'image/jpeg',
      originalname: 'malicious.jpg',
    } as Express.Multer.File;

    await expect(service.processAndSavePhoto('dog-1', fakeJpg)).rejects.toThrow(
      'Nepodporovaný formát souboru. Povolené formáty jsou JPG, PNG a HEIC/HEIF.',
    );
  });

  it('rejects files where detected format contradicts file extension/mime', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const mismatchedFile = {
      buffer: pngBuffer,
      size: pngBuffer.length,
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
    } as Express.Multer.File;

    await expect(
      service.processAndSavePhoto('dog-1', mismatchedFile),
    ).rejects.toThrow('Obsah souboru neodpovídá deklarovanému typu obrázku.');
  });

  it('rejects HEIC file exceeding maximum pixel dimensions', async () => {
    // 10000 x 10000 = 100 MP > 50 MP limit
    const hugeHeic = createHeicBuffer(10000, 10000);
    const file = {
      buffer: hugeHeic,
      size: hugeHeic.length,
      mimetype: 'image/heic',
      originalname: 'huge.heic',
    } as Express.Multer.File;

    await expect(service.processAndSavePhoto('dog-1', file)).rejects.toThrow(
      'Rozměry obrázku překračují maximální povolený limit.',
    );
  });

  it('processes and saves a valid JPEG image as 500x500 WebP with an unguessable UUID filename', async () => {
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

    // Should use an unguessable UUID and not expose the dogId in filename
    expect(photoUrl).toMatch(
      /^\/uploads\/dogs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
    );
    expect(photoUrl).not.toContain('dog-1');

    const filename = path.basename(photoUrl);
    const diskPath = path.join(getDogUploadsDir(), filename);
    createdFiles.push(diskPath);

    expect(fs.existsSync(diskPath)).toBe(true);

    const metadata = await sharp(diskPath).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(500);
    expect(metadata.height).toBe(500);
  });

  it('processes and converts a valid HEIC file with UUID filename', async () => {
    const heicBuffer = createHeicBuffer(200, 200);
    const file = {
      buffer: heicBuffer,
      size: heicBuffer.length,
      mimetype: 'image/heic',
      originalname: 'photo.heic',
    } as Express.Multer.File;

    const photoUrl = await service.processAndSavePhoto('dog-2', file);

    expect(photoUrl).toMatch(
      /^\/uploads\/dogs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
    );

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

  it('deletes multiple photo files via deleteDogPhotos', async () => {
    const dogsDir = getDogUploadsDir();
    await fs.promises.mkdir(dogsDir, { recursive: true });
    const testFile1 = path.join(dogsDir, 'batch-del-1.webp');
    const testFile2 = path.join(dogsDir, 'batch-del-2.webp');
    await fs.promises.writeFile(testFile1, 'dummy1');
    await fs.promises.writeFile(testFile2, 'dummy2');

    expect(fs.existsSync(testFile1)).toBe(true);
    expect(fs.existsSync(testFile2)).toBe(true);

    await service.deleteDogPhotos([
      '/uploads/dogs/batch-del-1.webp',
      null,
      '/uploads/dogs/batch-del-2.webp',
    ]);

    expect(fs.existsSync(testFile1)).toBe(false);
    expect(fs.existsSync(testFile2)).toBe(false);
  });

  it('safely handles deletePhotoFile with null, undefined, or missing file', async () => {
    await expect(service.deletePhotoFile(null)).resolves.not.toThrow();
    await expect(service.deletePhotoFile(undefined)).resolves.not.toThrow();
    await expect(
      service.deletePhotoFile('/uploads/dogs/nonexistent.webp'),
    ).resolves.not.toThrow();
  });
});
