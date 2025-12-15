import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WelcomeRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if user just logged in (coming from login page)
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');

    // Show welcome screen when user logs in or on first visit
    if (justLoggedIn && isAuthenticated) {
      // Clear the flag and redirect to welcome
      sessionStorage.removeItem('justLoggedIn');
      localStorage.removeItem('hasSeenWelcome'); // Reset welcome flag
      navigate('/welcome');
    } else {
      // First time visitor check
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome && location.pathname === '/') {
        navigate('/welcome');
      }
    }
  }, [navigate, location, isAuthenticated, user]);

  return null;
};

export default WelcomeRedirect;
