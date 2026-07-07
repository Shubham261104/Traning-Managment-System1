import React from 'react';
import { FiX, FiDownload, FiAward, FiShare2, FiCheckCircle } from 'react-icons/fi';
import './CertificateModal.css';

const CertificateModal = ({ isOpen, onClose, certificate, onDownload }) => {
    if (!isOpen || !certificate) return null;

    const studentName = `${certificate.student?.profile?.firstName || ''} ${certificate.student?.profile?.lastName || ''}`;
    const courseTitle = certificate.course?.title || 'Unknown Course';
    const issueDate = certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : 'N/A';
    const certId = certificate.certificateId || 'N/A';

    return (
        <div className="certificate-modal-overlay">
            <div className="certificate-modal-container animate-scaleIn">
                <button className="certificate-modal-close" onClick={onClose}>
                    <FiX size={24} />
                </button>

                <div className="certificate-preview-wrapper shadow-2xl">
                    {/* Animated Background Elements */}
                    <div className="cert-bg-glow"></div>
                    <div className="cert-bg-pattern"></div>

                    <div className="certificate-content">
                        {/* Certified Logo - Top Left */}
                        <div className="cert-certified-badge">
                            <div className="cert-certified-inner">
                                <FiCheckCircle size={24} />
                                <span>CERTIFIED</span>
                            </div>
                        </div>

                        {/* Header section */}
                        <div className="cert-header">
                            <div className="cert-logo-container">
                                <div className="cert-badge-glow"></div>
                                <FiAward size={48} className="cert-main-badge" />
                            </div>
                            <div className="cert-brand">
                                <h2 className="cert-brand-academy">SkillBridge</h2>
                                <p className="cert-brand-tagline">PLATFORM OF EXCELLENCE</p>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="cert-title-section">
                            <h1 className="cert-title-main">Certificate</h1>
                            <h2 className="cert-title-sub">OF COMPLETION</h2>
                            <div className="cert-divider">
                                <div className="cert-divider-line"></div>
                                <FiCheckCircle size={16} className="cert-divider-icon" />
                                <div className="cert-divider-line"></div>
                            </div>
                        </div>

                        {/* Recipient Section */}
                        <div className="cert-recipient-section">
                            <p className="cert-label">This specifies that</p>
                            <h3 className="cert-student-name">{studentName}</h3>
                            <p className="cert-label">has successfully mastered the curriculum for</p>
                            <h4 className="cert-course-name">{courseTitle}</h4>
                        </div>

                        {/* Verification Section */}
                        <div className="cert-footer">
                            <div className="cert-signature-block">
                                <div className="cert-signature-line"></div>
                                <p className="cert-footer-label">ACADEMIC DIRECTOR</p>
                            </div>

                            <div className="cert-verification-details">
                                <div className="cert-info-item">
                                    <span className="cert-info-label">Issued On</span>
                                    <span className="cert-info-value">{issueDate}</span>
                                </div>
                                <div className="cert-info-item">
                                    <span className="cert-info-label">Credential ID</span>
                                    <span className="cert-info-value font-mono">{certId}</span>
                                </div>
                            </div>

                            <div className="cert-signature-block">
                                <div className="cert-signature-line"></div>
                                <p className="cert-footer-label">DATE OF ISSUANCE</p>
                            </div>
                        </div>

                        {/* Holographic Seal */}
                        <div className="cert-hologram ">
                            <div className="cert-hologram-inner">
                                <FiAward size={24} />
                                <span>VERIFIED</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="certificate-modal-actions">
                    <button
                        onClick={() => onDownload(certificate._id)}
                        className="cert-action-btn primary"
                    >
                        <FiDownload /> Download Official PDF
                    </button>
                    <button className="cert-action-btn secondary">
                        <FiShare2 /> Share Credential
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
