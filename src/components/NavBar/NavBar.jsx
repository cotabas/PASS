// React Imports
import React, { useState } from 'react';
// Inrupt Library Imports
import { useSession } from '@hooks';
// Material UI Imports
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
// Component Imports
import { LogoutModal } from '../Modals';
import NavbarDesktop from './NavbarDesktop';
import NavbarLoggedOut from './NavbarLoggedOut';
import NavbarMobile from './NavbarMobile';

/**
 * NavBar Component - Component that generates proper NavBar section for PASS
 *
 * @memberof GlobalComponents
 * @name NavBar
 */

const NavBarNew = () => {
  const { session } = useSession();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  // state for LogoutModal component
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Event handler for logging out of SOLID POD and removing items from localStorage
  const handleLogout = () => {
    localStorage.clear();
    setShowConfirmation(false);
  };

  return session.info.isLoggedIn ? (
    <>
      {isSmallScreen && <NavbarMobile setShowConfirmation={setShowConfirmation} />}
      {isLargeScreen && <NavbarDesktop setShowConfirmation={setShowConfirmation} />}
      <LogoutModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        handleLogout={handleLogout}
      />
    </>
  ) : (
    <NavbarLoggedOut />
  );
};

export default NavBarNew;
