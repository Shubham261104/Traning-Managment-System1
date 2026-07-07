const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dirs exist
const uploadDir = path.join(__dirname, '../uploads/team');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname) {
            return cb(null, true);
        }
        cb(new Error('Only images/PDFs are allowed'));
    }
});

// Seed Route (Run once)
router.post('/seed', async (req, res) => {
    try {
        const count = await TeamMember.countDocuments();
        if (count > 0) return res.status(400).json({ message: 'Already seeded' });

        const seedData = [
            {
                memberId: 'shubham-kumar',
                name: 'Shubham Kumar',
                role: 'Full Stack Developer',
                description: 'Passionate developer with expertise in MERN stack and cloud architecture. Leads the backend development and system design.',
                about: 'A dedicated Full Stack Developer with deep knowledge of MERN stack. Shubham architecture the entire backend system of this project, ensuring scalability and security. He loves solving complex algorithmic problems and optimizing database queries.',
                email: 'shubham@example.com',
                phone: '+91 98765 43210',
                location: 'Patna, India',
                projectRole: 'Lead Backend Developer & System Architect',
                skills: ['Node.js', 'Express', 'MongoDB', 'React', 'AWS', 'System Design'],
                color: 'from-blue-500 to-indigo-600',
                linkedin: 'https://www.linkedin.com/in/shubham260606/',
                github: 'https://github.com/Shubham261104'
            },
            {
                memberId: 'amrit-raj',
                name: 'Amrit Raj',
                role: 'Frontend Architect',
                description: 'Creative UI/UX specialist focused on crafting intuitive and beautiful user experiences with modern React libraries.',
                about: 'Amrit is a creative frontend developer who breathes life into designs. He implemented the responsive UI/UX of this platform using React and Tailwind CSS. He pays attention to every pixel and animation detail.',
                email: 'amrit@example.com',
                phone: '+91 98765 43211',
                location: 'Patna, India',
                projectRole: 'Lead Frontend Developer & UI/UX Designer',
                skills: ['React.js', 'Tailwind CSS', 'Redux', 'Figma', 'UI/UX Design'],
                color: 'from-purple-500 to-pink-600'
            },
            {
                memberId: 'harsh-kumar',
                name: 'Harsh Kumar',
                role: 'Database Engineer',
                description: 'Expert in database optimization and full-stack integration. Ensures data integrity and high-performance system routing.',
                about: 'Harsh is an expert in data management and seamless integration. He worked on the database schema design and API integrations. His focus on performance ensures the application runs smoothly under load.',
                email: 'harsh@example.com',
                phone: '+91 98765 43212',
                location: 'Patna, India',
                projectRole: 'Database Engineer & API Specialist',
                skills: ['MongoDB', 'SQL', 'API Integration', 'Python', 'Data Structures'],
                color: 'from-orange-500 to-red-600'
            }
        ];

        await TeamMember.insertMany(seedData);
        res.json({ message: 'Seeded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All
router.get('/', async (req, res) => {
    try {
        const members = await TeamMember.find().sort({ createdAt: 1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get One
router.get('/:id', async (req, res) => {
    try {
        const member = await TeamMember.findOne({ memberId: req.params.id });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create (Admin Only)
router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { memberId } = req.body;
        const exists = await TeamMember.findOne({ memberId });
        if (exists) return res.status(400).json({ message: 'Member ID already exists' });

        const member = new TeamMember(req.body);
        await member.save();
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update (Admin Only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const member = await TeamMember.findOneAndUpdate(
            { memberId: req.params.id },
            req.body,
            { new: true }
        );
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete (Admin Only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const member = await TeamMember.findOneAndDelete({ memberId: req.params.id });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json({ message: 'Member deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Avatar (Admin Only)
router.post('/:id/avatar', auth, authorize('admin'), upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const avatarUrl = `/uploads/team/${req.file.filename}`;

        const member = await TeamMember.findOneAndUpdate(
            { memberId: req.params.id },
            { avatar: avatarUrl },
            { new: true }
        );
        res.json(member);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload CV (Admin Only)
router.post('/:id/cv', auth, authorize('admin'), upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const cvUrl = `/uploads/team/${req.file.filename}`;

        const member = await TeamMember.findOneAndUpdate(
            { memberId: req.params.id },
            { cv: cvUrl },
            { new: true }
        );
        res.json(member);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
