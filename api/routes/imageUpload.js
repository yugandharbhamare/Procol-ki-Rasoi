const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Ensure optimized directory exists
const ensureOptimizedDir = async () => {
  const optimizedDir = path.join(__dirname, '../../public/optimized');
  try {
    await fs.access(optimizedDir);
  } catch {
    await fs.mkdir(optimizedDir, { recursive: true });
  }
  return optimizedDir;
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
  },
});

// Upload and optimize image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { folder = 'optimized' } = req.body;
    
    // Ensure directory exists
    const optimizedDir = await ensureOptimizedDir();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = 'jpg'; // Always save as JPEG for consistency
    const fileName = `menu_${timestamp}_${randomString}.${extension}`;
    
    // Optimize image using Sharp
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    // Save optimized image
    const filePath = path.join(optimizedDir, fileName);
    await fs.writeFile(filePath, optimizedBuffer);

    // Return success response
    res.json({
      success: true,
      fileName,
      url: `/optimized/${fileName}`,
      optimizedUrl: `/optimized/${fileName}`,
      size: optimizedBuffer.length,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload and optimize image',
      details: error.message 
    });
  }
});

// Delete image
router.delete('/delete-image', async (req, res) => {
  try {
    const { fileName, folder = 'optimized' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'No filename provided' });
    }

    const optimizedDir = await ensureOptimizedDir();
    const filePath = path.join(optimizedDir, fileName);
    
    // Check if file exists and delete
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      res.json({ 
        success: true, 
        message: 'Image deleted successfully' 
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message 
    });
  }
});

// Get image info
router.get('/image-info/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const optimizedDir = await ensureOptimizedDir();
    const filePath = path.join(optimizedDir, fileName);
    
    const stats = await fs.stat(filePath);
    
    res.json({
      success: true,
      fileName,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ 
        error: 'Failed to get image info',
        details: error.message 
      });
    }
  }
});

module.exports = router;
