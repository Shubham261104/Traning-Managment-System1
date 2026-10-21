import React, { useState } from 'react';
import { FiX, FiDownload, FiShare2, FiShield, FiPrinter, FiCheckCircle, FiAward, FiCopy, FiCheck } from 'react-icons/fi';
import './CertificateModal.css';

const CertificateModal = ({ isOpen, onClose, certificate, onDownload }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  // 1. Dynamic Student Name
  const studentProfile = certificate.student?.profile || {};
  const sFirstName = studentProfile.firstName || '';
  const sLastName = studentProfile.lastName || '';
  let studentName = `${sFirstName} ${sLastName}`.trim();
  if (!studentName && certificate.student?.email) {
    studentName = certificate.student.email.split('@')[0];
  }
  if (!studentName) {
    studentName = 'Student';
  }

  // 2. Dynamic Course Title
  const courseTitle = certificate.course?.title || 'Training & Skill Development Course';

  // 3. Dynamic Instructor Name (DO NOT hardcode)
  const instructorObj = certificate.course?.instructor;
  let instructorName = '';

  if (instructorObj && typeof instructorObj === 'object') {
    if (instructorObj.profile) {
      const fName = instructorObj.profile.firstName || '';
      const lName = instructorObj.profile.lastName || '';
      instructorName = `${fName} ${lName}`.trim();
    }
    if (!instructorName && instructorObj.name) {
      instructorName = instructorObj.name;
    }
    if (!instructorName && instructorObj.email) {
      instructorName = instructorObj.email.split('@')[0];
    }
  } else if (typeof instructorObj === 'string') {
    instructorName = instructorObj;
  }

  if (!instructorName) {
    instructorName = 'Course Instructor';
  }

  // 4. Admin Name (Always Admin SkillBridge)
  const adminName = 'Admin SkillBridge';
  const adminOrganization = 'SkillBridge Training Center';

  // 5. Completion Date & ID formatting
  const rawDate = certificate.issuedAt || certificate.createdAt || new Date();
  const issueDate = new Date(rawDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const rawCertId = certificate.certificateId || `SKB-${Date.now().toString().slice(-6)}`;
  const certId = rawCertId.startsWith('SKB-') ? rawCertId : `SKB-${rawCertId.replace(/^CERT-/, '')}`;

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verify?id=${encodeURIComponent(certId)}`;
    const shareText = `Check out my Certificate of Completion for ${courseTitle} from SkillBridge! Certificate ID: ${certId}`;

    if (navigator.share && navigator.canShare && navigator.canShare({ title: 'SkillBridge Certificate', text: shareText, url: shareUrl })) {
      try {
        await navigator.share({
          title: `SkillBridge Certificate - ${courseTitle}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share error:', err);
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`SkillBridge Certificate Verified | ID: ${certId} | ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      alert(`Certificate Credential ID: ${certId}\nVerification URL: ${shareUrl}`);
    }
  };

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Modal Header */}
        <div className="cert-modal-toolbar">
          <div className="cert-modal-title">
            <FiAward className="cert-title-icon" />
            <span>Official Academic Certificate</span>
          </div>
          <button className="cert-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>

        {/* Viewport Sized Certificate Stage */}
        <div className="cert-stage-wrapper">
          <div className="certificate-printable-area" id="certificate-canvas">
            <div className="cert-card-frame">

              {/* Watermark Logo (Center Background) */}
              <div className="cert-watermark-overlay" aria-hidden="true">
                <svg viewBox="0 0 100 100" className="watermark-shield">
                  <path fill="currentColor" d="M50 5 L85 20 L85 55 C85 75 50 95 50 95 C50 95 15 75 15 55 L15 20 Z" />
                </svg>
                <div className="watermark-brand">SKILLBRIDGE</div>
              </div>

              {/* Decorative Corner Borders */}
              <div className="cert-corner-accent top-left"></div>
              <div className="cert-corner-accent top-right"></div>
              <div className="cert-corner-accent bottom-left"></div>
              <div className="cert-corner-accent bottom-right"></div>

              {/* Inner Certificate Layout */}
              <div className="cert-inner-layout">

                {/* 1. Header Logo & Branding */}
                <div className="cert-brand-header">
                  <div className="cert-brand-logo">
                    <div className="cert-logo-icon">
                      <FiShield size={24} />
                    </div>
                    <div className="cert-logo-text">
                      <h2 className="brand-title">SKILLBRIDGE</h2>
                      <p className="brand-sub">Training Center Management System</p>
                    </div>
                  </div>
                </div>

                {/* 2. Certificate Title */}
                <div className="cert-heading-block">
                  <div className="cert-ornament-line">
                    <span className="line"></span>
                    <span className="diamond">◆</span>
                    <span className="line"></span>
                  </div>
                  <h1 className="cert-primary-title">CERTIFICATE OF COMPLETION</h1>
                </div>

                {/* 3. Recipient & Course Details */}
                <div className="cert-recipient-block">
                  <p className="cert-presented-lead">This certificate is proudly presented to</p>

                  <div className="cert-student-name-box">
                    <h3 className="cert-student-name">{studentName}</h3>
                    <div className="cert-name-underline"></div>
                  </div>

                  <p className="cert-completing-lead">for successfully completing</p>

                  <h4 className="cert-course-name">{courseTitle}</h4>

                  <div className="cert-completion-pill">
                    <span>Course Completion: <strong>100%</strong></span>
                  </div>

                  <p className="cert-statement-text">
                    This certificate certifies that the student has successfully completed all required course modules and assessments.
                  </p>
                </div>

                {/* 4. Details Grid: Instructor, Metadata/Seal, Admin */}
                <div className="cert-details-grid">

                  {/* Left: Instructor Info & Signature */}
                  <div className="cert-grid-col col-instructor">
                    <div className="cert-meta-item">
                      <span className="meta-label">Instructor:</span>
                      <strong className="meta-val">{instructorName}</strong>
                    </div>

                    <div className="signature-box">
                      <div className="signature-handwritten">{instructorName}</div>
                      <div className="signature-line"></div>
                      <span className="sig-title">Instructor Signature</span>
                      <strong className="sig-person">{instructorName}</strong>
                    </div>
                  </div>

                  {/* Center: Official Seal & Dates */}
                  <div className="cert-grid-col col-seal">
                    <div className="cert-seal-badge">
                      <div className="seal-outer-ring">
                        <div className="seal-inner-ring">
                          <FiCheckCircle className="seal-icon" />
                          <span className="seal-txt-main">OFFICIAL</span>
                          <span className="seal-txt-sub">SEAL</span>
                          <span className="seal-stars">★ ★ ★</span>
                        </div>
                      </div>
                    </div>

                    <div className="cert-meta-list">
                      <div className="meta-row">
                        <span className="lbl">Issued by:</span>
                        <strong className="val">SkillBridge</strong>
                      </div>
                      <div className="meta-row">
                        <span className="lbl">Date:</span>
                        <strong className="val">{issueDate}</strong>
                      </div>
                      <div className="meta-row">
                        <span className="lbl">Certificate ID:</span>
                        <code className="val cert-id-badge">{certId}</code>
                      </div>
                    </div>
                  </div>

                  {/* Right: Admin Info & Signature */}
                  <div className="cert-grid-col col-admin">
                    <div className="cert-meta-item">
                      <span className="meta-label">Authorized By:</span>
                      <strong className="meta-val">{adminName}</strong>
                    </div>

                    <div className="signature-box">
                      <div className="signature-handwritten admin-font">{adminName}</div>
                      <div className="signature-line"></div>
                      <span className="sig-title">Admin Signature</span>
                      <strong className="sig-person">{adminName}</strong>
                      <span className="sig-org">{adminOrganization}</span>
                    </div>
                  </div>

                </div>

                {/* 5. Bottom Verification Footer */}
                <div className="cert-bottom-verification">
                  <FiShield className="verify-icon" />
                  <span>Verify this certificate using Certificate ID: <strong className="cert-code">{certId}</strong></span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Toolbar */}
        <div className="cert-modal-actions">
          <button onClick={onClose} className="cert-btn btn-close">
            <FiX size={16} />
            <span>Close</span>
          </button>

          <button onClick={() => onDownload(certificate._id)} className="cert-btn btn-download">
            <FiDownload size={16} />
            <span>Download PDF</span>
          </button>

          <button onClick={handlePrint} className="cert-btn btn-print">
            <FiPrinter size={16} />
            <span>Print</span>
          </button>

          <button onClick={handleShare} className="cert-btn btn-share">
            {copied ? <FiCheck size={16} /> : <FiShare2 size={16} />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateModal;
