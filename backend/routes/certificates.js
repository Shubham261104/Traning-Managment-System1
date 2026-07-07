const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { auth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

// Generate certificate
router.post('/generate', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Check if enrollment is completed
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
      status: 'approved',
      completed: true
    });

    if (!enrollment) {
      return res.status(400).json({ message: 'Course not completed' });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      student: userId,
      course: courseId
    });

    if (certificate) {
      return res.json({ message: 'Certificate already exists', certificate });
    }

    // Generate certificate
    const course = await Course.findById(courseId);
    const user = await User.findById(userId).populate('profile');
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const verificationCode = Math.random().toString(36).substr(2, 15).toUpperCase();

    certificate = new Certificate({
      student: userId,
      course: courseId,
      certificateId,
      verificationCode
    });

    await certificate.save();

    res.json({ message: 'Certificate generated successfully', certificate });
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download certificate PDF
router.get('/:id/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'email')
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          populate: { path: 'profile' }
        }
      });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Check if user owns the certificate or is admin
    if (certificate.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollment = await Enrollment.findOne({
      student: certificate.student._id,
      course: certificate.course._id
    });

    // Get instructor name
    const instructor = certificate.course.instructor;
    const instructorName = instructor?.profile
      ? `${instructor.profile.firstName || ''} ${instructor.profile.lastName || ''}`.trim() || 'Instructor'
      : 'Instructor';

    // Format date
    const issueDate = new Date(certificate.issuedAt);
    const formattedDate = issueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      layout: 'landscape',
      margin: 0
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateId}.pdf`);

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background Color (Deep Navy)
    doc.rect(0, 0, pageWidth, pageHeight).fill('#0f172a');

    // Decorative Border (Gold)
    const margin = 30;
    doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2))
      .lineWidth(3)
      .strokeColor('#f59e0b')
      .stroke();

    // Inner Accent Border
    doc.rect(margin + 5, margin + 5, pageWidth - (margin * 2) - 10, pageHeight - (margin * 2) - 10)
      .lineWidth(1)
      .strokeColor('#fbbf24')
      .stroke();

    // Corner Accents
    const cornerSize = 60;
    // Top Left
    doc.rect(margin, margin, cornerSize, 5).fill('#f59e0b');
    doc.rect(margin, margin, 5, cornerSize).fill('#f59e0b');
    // Top Right
    doc.rect(pageWidth - margin - cornerSize, margin, cornerSize, 5).fill('#f59e0b');
    doc.rect(pageWidth - margin - 5, margin, 5, cornerSize).fill('#f59e0b');
    // Bottom Left
    doc.rect(margin, pageHeight - margin - 5, cornerSize, 5).fill('#f59e0b');
    doc.rect(margin, pageHeight - margin - cornerSize, 5, cornerSize).fill('#f59e0b');
    // Bottom Right
    doc.rect(pageWidth - margin - cornerSize, pageHeight - margin - 5, cornerSize, 5).fill('#f59e0b');
    doc.rect(pageWidth - margin - 5, pageHeight - margin - cornerSize, 5, cornerSize).fill('#f59e0b');

    // CERTIFIED Badge - Top Left Corner
    const certifiedBadgeX = margin + 50;
    const certifiedBadgeY = margin + 50;
    const badgeRadius = 30;

    doc.circle(certifiedBadgeX, certifiedBadgeY, badgeRadius)
      .lineWidth(1.5)
      .strokeColor('#22c55e')
      .stroke();

    doc.fillColor('#22c55e')
      .fontSize(7)
      .text('✓', certifiedBadgeX - 5, certifiedBadgeY - 12, { width: 10, align: 'center' });

    doc.fillColor('#22c55e')
      .fontSize(6)
      .text('CERTIFIED', certifiedBadgeX - badgeRadius, certifiedBadgeY + 2, { width: badgeRadius * 2, align: 'center' });

    // VERIFIED Seal - Top Right Corner
    const verifiedBadgeX = pageWidth - margin - 50;
    const verifiedBadgeY = margin + 50;

    doc.circle(verifiedBadgeX, verifiedBadgeY, badgeRadius)
      .lineWidth(1.5)
      .strokeColor('#f59e0b')
      .stroke();

    doc.fillColor('#fbbf24')
      .fontSize(7)
      .text('★', verifiedBadgeX - 5, verifiedBadgeY - 12, { width: 10, align: 'center' });

    doc.fillColor('#fbbf24')
      .fontSize(6)
      .text('VERIFIED', verifiedBadgeX - badgeRadius, verifiedBadgeY + 2, { width: badgeRadius * 2, align: 'center' });

    // Branding
    doc.fillColor('#fbbf24')
      .fontSize(10)
      .text('SKILLBRIDGE PLATFORM OF EXCELLENCE', 0, margin + 40, { align: 'center', width: pageWidth });

    // Certificate Title - Adjusted position to prevent overlap
    const titleY = pageHeight / 2 - 120;
    doc.fillColor('#ffffff')
      .fontSize(50)
      .text('CERTIFICATE', 0, titleY, { align: 'center', width: pageWidth });

    doc.fillColor('#94a3b8')
      .fontSize(20)
      .text('OF COMPLETION', 0, doc.y + 5, { align: 'center', width: pageWidth, characterSpacing: 5 });

    // Golden Divider
    doc.moveTo(pageWidth / 2 - 150, doc.y + 20)
      .lineTo(pageWidth / 2 + 150, doc.y + 20)
      .strokeColor('#f59e0b')
      .lineWidth(1)
      .stroke();

    // Content - Adjusted spacing
    doc.fillColor('#94a3b8')
      .fontSize(14)
      .text('THIS IS TO OFFICIALLY CERTIFY THAT', 0, doc.y + 35, { align: 'center', width: pageWidth });

    doc.fillColor('#ffffff')
      .fontSize(36)
      .text(`${certificate.student.profile.firstName} ${certificate.student.profile.lastName}`.toUpperCase(), 0, doc.y + 12, { align: 'center', width: pageWidth });

    doc.fillColor('#94a3b8')
      .fontSize(14)
      .text('HAS SUCCESSFULLY MASTERED ALL REQUIREMENTS FOR THE CURRICULUM', 0, doc.y + 15, { align: 'center', width: pageWidth });

    doc.fillColor('#fbbf24')
      .fontSize(24)
      .text(certificate.course.title.toUpperCase(), 0, doc.y + 12, { align: 'center', width: pageWidth });

    // Bottom Section (Signatures & Verification)
    const bottomY = pageHeight - 120;

    // Instructor Signature
    doc.moveTo(120, bottomY)
      .lineTo(320, bottomY)
      .strokeColor('#ffffff')
      .lineWidth(0.5)
      .stroke();

    doc.fillColor('#ffffff')
      .fontSize(12)
      .text(instructorName, 120, bottomY + 10, { width: 200, align: 'center' });

    doc.fillColor('#64748b')
      .fontSize(9)
      .text('COURSE INSTRUCTOR', 120, bottomY + 25, { width: 200, align: 'center' });

    // Center Seal - Moved to bottom center
    doc.circle(pageWidth / 2, bottomY + 5, 35)
      .lineWidth(2)
      .strokeColor('#f59e0b')
      .stroke();

    doc.fillColor('#fbbf24')
      .fontSize(8)
      .text('OFFICIAL', pageWidth / 2 - 35, bottomY - 5, { width: 70, align: 'center' });

    doc.fillColor('#fbbf24')
      .fontSize(6)
      .text('SEAL', pageWidth / 2 - 35, bottomY + 8, { width: 70, align: 'center' });

    // Issue Date
    doc.moveTo(pageWidth - 320, bottomY)
      .lineTo(pageWidth - 120, bottomY)
      .strokeColor('#ffffff')
      .lineWidth(0.5)
      .stroke();

    doc.fillColor('#ffffff')
      .fontSize(12)
      .text(formattedDate, pageWidth - 320, bottomY + 10, { width: 200, align: 'center' });

    doc.fillColor('#64748b')
      .fontSize(9)
      .text('DATE OF ISSUANCE', pageWidth - 320, bottomY + 25, { width: 200, align: 'center' });

    // Footer Info
    doc.fillColor('#475569')
      .fontSize(8)
      .text(`Credential ID: ${certificate.certificateId}  |  Verification Code: ${certificate.verificationCode}`, 0, pageHeight - margin - 20, { align: 'center', width: pageWidth });

    doc.end();
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get certificate by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'email')
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      })
      .populate('course');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

