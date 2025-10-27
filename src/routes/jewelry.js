const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

// Check if using cloud storage
const useCloudStorage = process.env.CLOUDINARY_URL || process.env.NODE_ENV === 'production';

let upload;

if (useCloudStorage) {
    // Cloudinary setup for production
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    // Cloudinary is configured via CLOUDINARY_URL environment variable
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'jewelry',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
        }
    });

    upload = multer({
        storage: storage,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });
} else {
    // Local file storage for development
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../../public/uploads');
            // Create uploads directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    upload = multer({
        storage: storage,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        },
        fileFilter: (req, file, cb) => {
            // Check if file is an image
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'), false);
            }
        }
    });
}

// Get all jewelry items
router.get('/jewelry', (req, res) => {
    db.all(`
        SELECT id, name, image_path, weight, weight_unit, working_cost, metal_type, purity, created_at
        FROM jewelry
        ORDER BY created_at DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Error fetching jewelry:', err);
            return res.status(500).json({ error: 'Failed to fetch jewelry items' });
        }

        // Convert image paths to URLs
        const jewelry = rows.map(item => ({
            ...item,
            image_url: item.image_path ? (
                useCloudStorage ? item.image_path : `/uploads/${path.basename(item.image_path)}`
            ) : null
        }));

        res.json(jewelry);
    });
});

// Get single jewelry item
router.get('/jewelry/:id', (req, res) => {
    const { id } = req.params;

    const selectQuery = process.env.DATABASE_URL
        ? `SELECT id, name, image_path, weight, weight_unit, working_cost, metal_type, purity, created_at
           FROM jewelry
           WHERE id = $1`
        : `SELECT id, name, image_path, weight, weight_unit, working_cost, metal_type, purity, created_at
           FROM jewelry
           WHERE id = ?`;

    db.get(selectQuery, [id], (err, row) => {
        if (err) {
            console.error('Error fetching jewelry item:', err);
            return res.status(500).json({ error: 'Failed to fetch jewelry item' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Jewelry item not found' });
        }

        // Convert image path to URL
        const jewelry = {
            ...row,
            image_url: row.image_path ? (
                useCloudStorage ? row.image_path : `/uploads/${path.basename(row.image_path)}`
            ) : null
        };

        res.json(jewelry);
    });
});

// Add new jewelry item
router.post('/jewelry', upload.single('image'), (req, res) => {
    const { name, weight, weight_unit = 'tola', working_cost = 0, metal_type = 'silver', purity = 24 } = req.body;
    const image_path = req.file ? (useCloudStorage ? req.file.path : req.file.path) : null;

    if (!name || !weight) {
        return res.status(400).json({ error: 'Name and weight are required' });
    }

    // For PostgreSQL, use RETURNING clause to get the ID
    const query = process.env.DATABASE_URL 
        ? `INSERT INTO jewelry (name, image_path, weight, weight_unit, working_cost, metal_type, purity)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
        : `INSERT INTO jewelry (name, image_path, weight, weight_unit, working_cost, metal_type, purity)
           VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [name, image_path, parseFloat(weight), weight_unit, parseFloat(working_cost), metal_type, parseInt(purity)], function(err) {
        if (err) {
            console.error('Error adding jewelry:', err);
            return res.status(500).json({ error: 'Failed to add jewelry item' });
        }

        res.json({
            id: this.lastID,
            message: 'Jewelry item added successfully'
        });
    });
});

// Update jewelry item
router.put('/jewelry/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, weight, weight_unit, working_cost, metal_type, purity } = req.body;
    const newImagePath = req.file ? req.file.path : null;

    // First get the current item to handle image replacement
    db.get('SELECT image_path FROM jewelry WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching current jewelry:', err);
            return res.status(500).json({ error: 'Failed to update jewelry item' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Jewelry item not found' });
        }

        // Delete old image if new one is uploaded
        if (newImagePath && row.image_path && row.image_path !== newImagePath) {
            if (!useCloudStorage) {
                // Only delete local files
                try {
                    fs.unlinkSync(row.image_path);
                } catch (error) {
                    console.warn('Failed to delete old image:', error);
                }
            }
            // For Cloudinary, old images are automatically managed
        }

        const imagePath = newImagePath || row.image_path;

        const updateQuery = process.env.DATABASE_URL
            ? `UPDATE jewelry
               SET name = $1, image_path = $2, weight = $3, weight_unit = $4, working_cost = $5, metal_type = $6, purity = $7, updated_at = CURRENT_TIMESTAMP
               WHERE id = $8`
            : `UPDATE jewelry
               SET name = ?, image_path = ?, weight = ?, weight_unit = ?, working_cost = ?, metal_type = ?, purity = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`;

        db.run(updateQuery, [name, imagePath, parseFloat(weight), weight_unit, parseFloat(working_cost), metal_type, parseInt(purity), id], function(err) {
            if (err) {
                console.error('Error updating jewelry:', err);
                return res.status(500).json({ error: 'Failed to update jewelry item' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Jewelry item not found' });
            }

            res.json({ message: 'Jewelry item updated successfully' });
        });
    });
});

// Delete jewelry item
router.delete('/jewelry/:id', (req, res) => {
    const { id } = req.params;

    // First get the image path to delete the file
    const selectQuery = process.env.DATABASE_URL 
        ? 'SELECT image_path FROM jewelry WHERE id = $1'
        : 'SELECT image_path FROM jewelry WHERE id = ?';
    
    db.get(selectQuery, [id], (err, row) => {
        if (err) {
            console.error('Error fetching jewelry for deletion:', err);
            return res.status(500).json({ error: 'Failed to delete jewelry item' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Jewelry item not found' });
        }

        // Delete the image file if it exists
        if (row.image_path && !useCloudStorage) {
            // Only delete local files
            try {
                fs.unlinkSync(row.image_path);
            } catch (error) {
                console.warn('Failed to delete image file:', error);
            }
        }
        // For Cloudinary, images can be left for CDN caching or manually cleaned later

        // Delete from database
        const deleteQuery = process.env.DATABASE_URL 
            ? 'DELETE FROM jewelry WHERE id = $1'
            : 'DELETE FROM jewelry WHERE id = ?';

        db.run(deleteQuery, [id], function(err) {
            if (err) {
                console.error('Error deleting jewelry:', err);
                return res.status(500).json({ error: 'Failed to delete jewelry item' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Jewelry item not found' });
            }

            res.json({ message: 'Jewelry item deleted successfully' });
        });
    });
});

module.exports = router;