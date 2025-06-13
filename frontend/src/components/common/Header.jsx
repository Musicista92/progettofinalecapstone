import React, { useState } from "react";
import { Navbar, Nav, NavDropdown, Container, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Music,
  Calendar,
  User,
  LogOut,
  Heart,
  PlusCircle,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import NotificationSystem from "./NotificationSystem";

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin, isOrganizer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setExpanded(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      fixed="top"
      className="navbar-custom"
      expanded={expanded}
      onToggle={(isExpanded) => setExpanded(isExpanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={handleNavClick}>
          <Music className="me-2" size={24} />
          RitmoCaribe
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/"
              className={isActiveRoute("/")}
              onClick={handleNavClick}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/events"
              className={isActiveRoute("/events")}
              onClick={handleNavClick}
            >
              <Calendar size={18} className="me-1" />
              Eventi
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto align-items-center">
            {!isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  className={isActiveRoute("/login")}
                  onClick={handleNavClick}
                >
                  Accedi
                </Nav.Link>
                <Button
                  as={Link}
                  to="/register"
                  className="btn-primary-custom ms-2"
                  onClick={handleNavClick}
                >
                  Registrati
                </Button>
              </>
            ) : (
              <>
                {(isOrganizer || isAdmin) && (
                  <Nav.Link
                    as={Link}
                    to="/create-event"
                    className={`${isActiveRoute("/create-event")} me-2`}
                    onClick={handleNavClick}
                  >
                    <PlusCircle size={18} className="me-1" />
                    Crea Evento
                  </Nav.Link>
                )}

                <NotificationSystem />

                <NavDropdown
                  title={
                    <span className="d-flex align-items-center">
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="rounded-circle me-2"
                        style={{
                          width: "32px",
                          height: "32px",
                          objectFit: "cover",
                        }}
                      />
                      <span className="d-none d-lg-inline">{user?.name}</span>
                      <ChevronDown
                        size={18}
                        className="ms-1 d-none d-lg-inline"
                      />
                    </span>
                  }
                  id="user-nav-dropdown"
                  align="end"
                  className="user-dropdown-toggle"
                >
                  <NavDropdown.Item
                    as={Link}
                    to={`/users/${user?._id}`}
                    onClick={handleNavClick}
                  >
                    <User size={16} className="me-2" />
                    Profilo
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to="/my-ritmo"
                    onClick={handleNavClick}
                  >
                    <Heart size={16} className="me-2" />
                    MyRitmo
                  </NavDropdown.Item>

                  {isAdmin && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item
                        as={Link}
                        to="/admin"
                        onClick={handleNavClick}
                      >
                        <Shield size={16} className="me-2" />
                        Admin Panel
                      </NavDropdown.Item>
                    </>
                  )}

                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut size={16} className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
