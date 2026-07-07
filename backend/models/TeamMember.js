const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    memberId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String }, // Short description for card
    about: { type: String }, // Long biography
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    projectRole: { type: String },
    skills: [String],
    color: { type: String, default: 'from-blue-500 to-indigo-600' },
    avatar: { type: String }, // URL path
    cv: { type: String }, // URL path to PDF
    linkedin: { type: String },
    github: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
