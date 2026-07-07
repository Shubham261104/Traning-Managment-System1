import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const TourGuide = ({ run, setRun, userRole }) => {
  const [steps, setSteps] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const getSteps = () => {
      if (userRole === 'admin') {
        return [
          {
            target: '.admin-dashboard-header',
            content: 'Welcome to the Admin Dashboard! Here you can see an overview of the system.',
            placement: 'bottom',
          },
          {
            target: '.stats-grid',
            content: 'Quickly view key statistics like total students, courses, and instructors.',
            placement: 'bottom',
          },
          {
            target: '.pending-enrollments',
            content: 'Manage and verify pending student enrollment requests here.',
            placement: 'right',
          },
          {
            target: '.quick-actions',
            content: 'Use these shortcuts to quickly access management sections.',
            placement: 'left',
          },
          {
            target: '.sidebar-nav',
            content: 'Navigate through different sections of the administration portal.',
            placement: 'right',
          },
          {
            target: '.user-profile-menu',
            content: 'Access your profile settings or log out from here.',
            placement: 'bottom',
          }
        ];
      } else if (userRole === 'instructor') {
        return [
          {
            target: '.instructor-dashboard-header',
            content: 'Welcome back, Instructor! This is your teaching command center.',
            placement: 'bottom',
          },
          {
            target: '.instructor-stats',
            content: 'Check your assigned courses and total student count at a glance.',
            placement: 'bottom',
          },
          {
            target: '.my-courses-section',
            content: 'Manage your active courses and track student enrollment.',
            placement: 'right',
          },
          {
            target: '.instructor-quick-actions',
            content: 'Send announcements or update your profile quickly.',
            placement: 'left',
          }
        ];
      } else if (userRole === 'student') {
        return [
          {
            target: '.student-dashboard-header',
            content: 'Hello Student! Welcome to your learning dashboard.',
            placement: 'bottom',
          },
          {
            target: '.student-stats',
            content: 'Track your learning progress, certificates, and pending requests.',
            placement: 'bottom',
          },
          {
            target: '.my-enrollments-section',
            content: 'Continue your learning journey by accessing your enrolled courses.',
            placement: 'right',
          },
          {
            target: '.certificates-section',
            content: 'View and download your earned certificates here.',
            placement: 'left',
          }
        ];
      }
      return [];
    };

    setSteps(getSteps());
  }, [userRole, location.pathname]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#1e293b',
          backgroundColor: '#1e293b',
          overlayColor: 'rgba(15, 23, 42, 0.85)',
          primaryColor: '#6366f1',
          textColor: '#f8fafc',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '10px',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#94a3b8',
          marginRight: 10,
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        buttonSkip: {
          color: '#f43f5e',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
      }}
    />
  );
};

export default TourGuide;
