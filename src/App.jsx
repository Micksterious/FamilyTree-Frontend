import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./AppStyles.css";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import FamilyTree from "./components/FamilyTree";
import FamilyMembersPage from "./components/FamilyMember";
import Relationships from "./components/Relationships";
import Spouses from "./components/Spouses";
import Userlist from "./components/Userlist";
import Profile from "./components/Profile";
import NotFound from "./components/NotFound";
import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";

const socket = io(SOCKETS_URL, {
  withCredentials: NODE_ENV === "production",
});

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });
  }, []);

  const checkAuth = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log("No token found");
    setUser(null);
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Auth check response:", response.data);
    setUser(response.data); // Not response.data.user - your backend returns the user directly
  } catch (error) {
    console.log("❌ Auth check failed:", error);
    setUser(null);
    localStorage.removeItem('token'); // Clear invalid token
  }
};

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
  try {
    localStorage.removeItem('token');
    setUser(null);
    // Optional: call backend logout if you have one
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
};

  return (
    <div>
      <NavBar user={user} onLogout={handleLogout} />
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route exact path="/" element={<Home />} />
          <Route path="/familytree" element={<FamilyTree />} />
          <Route path="/familymembers" element={<FamilyMembersPage />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/spouses" element={<Spouses />} />
          <Route path="/userlist" element={<Userlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const Root = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<Root />);
