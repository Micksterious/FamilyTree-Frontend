import React from "react";
import { Link } from "react-router-dom";
import "./NavBarStyles.css";

const NavBar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/familytree">Capstone II</Link>
      </div>

      <div className="nav-links">
        {user ? (
          <div className="user-section">
            <span className="username">Welcome, {user.username}!</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
            <Link to="/familymembers" className="nav-link">
              Family Members
            </Link>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
