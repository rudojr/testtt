const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

app.use(cors());
app.use(express.json());

// Health check
app.get(['/', '/api'], (_req, res) => {
  res.json({ message: 'IDSnap AI backend is running!' });
});

/**
 * POST /api/generate-id-photo or /generate-id-photo
 * Body (multipart/form-data):
 *   - image: file
 *   - size: '3x4' | '4x6'
 *   - background: 'blue' | 'white'
 *
 * Returns: processed image (JPEG)
 *
 * NOTE: This is a placeholder implementation using sharp for resizing/background.
 * Replace the processing logic with your AI model integration.
 */
app.post(['/generate-id-photo', '/api/generate-id-photo'], upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file ảnh.' });
    }

    const { size = '3x4', background = 'blue' } = req.body;

    // ID photo dimensions at 300 DPI (pixels)
    const dimensions = {
      '3x4': { width: 354, height: 472 },  // 3×4 cm at 300dpi
      '4x6': { width: 472, height: 709 },  // 4×6 cm at 300dpi
    };

    const bgColors = {
      blue:  { r: 74,  g: 144, b: 217 },
      white: { r: 255, g: 255, b: 255 },
    };

    const { width, height } = dimensions[size] || dimensions['3x4'];
    const bgColor = bgColors[background] || bgColors['blue'];

    // Process image: resize to fit, composite on solid background
    const processedImage = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: bgColor,
      },
    })
      .composite([
        {
          input: await sharp(req.file.buffer)
            .resize(width, height, {
              fit: 'cover',
              position: 'top', // keep face at top
            })
            .toBuffer(),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Disposition', `attachment; filename="idsnap-${size}-${background}.jpg"`);
    res.send(processedImage);
  } catch (err) {
    console.error('Error processing image:', err);
    res.status(500).json({ error: 'Lỗi xử lý ảnh. Vui lòng thử lại.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`IDSnap AI server running on port ${PORT}`);
});

module.exports = app;
