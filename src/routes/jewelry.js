const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

// Configure multer for image uploads
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

const upload = multer({
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
            image_url: item.image_path ? `/uploads/${path.basename(item.image_path)}` : null
        }));

        res.json(jewelry);
    });
});

// Get single jewelry item
router.get('/jewelry/:id', (req, res) => {
    const { id } = req.params;

    db.get(`
        SELECT id, name, image_path, weight, weight_unit, working_cost, metal_type, purity, created_at
        FROM jewelry
        WHERE id = ?
    `, [id], (err, row) => {
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
            image_url: row.image_path ? `/uploads/${path.basename(row.image_path)}` : null
        };

        res.json(jewelry);
    });
});

// Add new jewelry item
router.post('/jewelry', upload.single('image'), (req, res) => {
    const { name, weight, weight_unit = 'tola', working_cost = 0, metal_type = 'silver', purity = 24 } = req.body;
    const image_path = req.file ? req.file.path : null;

    if (!name || !weight) {
        return res.status(400).json({ error: 'Name and weight are required' });
    }

    db.run(`
        INSERT INTO jewelry (name, image_path, weight, weight_unit, working_cost, metal_type, purity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, image_path, parseFloat(weight), weight_unit, parseFloat(working_cost), metal_type, parseInt(purity)], function(err) {
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
            try {
                fs.unlinkSync(row.image_path);
            } catch (error) {
                console.warn('Failed to delete old image:', error);
            }
        }

        const imagePath = newImagePath || row.image_path;

        db.run(`
            UPDATE jewelry
            SET name = ?, image_path = ?, weight = ?, weight_unit = ?, working_cost = ?, metal_type = ?, purity = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, imagePath, parseFloat(weight), weight_unit, parseFloat(working_cost), metal_type, parseInt(purity), id], function(err) {
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
    db.get('SELECT image_path FROM jewelry WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching jewelry for deletion:', err);
            return res.status(500).json({ error: 'Failed to delete jewelry item' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Jewelry item not found' });
        }

        // Delete the image file if it exists
        if (row.image_path) {
            try {
                fs.unlinkSync(row.image_path);
            } catch (error) {
                console.warn('Failed to delete image file:', error);
            }
        }

        // Delete from database
        db.run('DELETE FROM jewelry WHERE id = ?', [id], function(err) {
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