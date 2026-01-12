import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import "../styles/Profile.css";

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to view this page.");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfileData(response.data);
      setPicturePreview(response.data.profilePicture || null);
      setFormData({
        username: response.data.username || "",
        email: response.data.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        navigate("/login");
      } else {
        setMessage({ type: "error", text: "Failed to load profile data" });
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (username) => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate passwords if trying to change password
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: "error", text: "New passwords do not match" });
        return;
      }
      if (!formData.currentPassword) {
        setMessage({ 
          type: "error", 
          text: "Current password is required to set a new password" 
        });
        return;
      }
      if (formData.newPassword.length < 6) {
        setMessage({ 
          type: "error", 
          text: "New password must be at least 6 characters" 
        });
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      
      // Use FormData to handle file upload
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      
      if (formData.newPassword) {
        submitData.append('currentPassword', formData.currentPassword);
        submitData.append('newPassword', formData.newPassword);
      }
      
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      const response = await axios.put(
        `${API_URL}/auth/profile`, 
        submitData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );

      setProfileData(response.data);
      setPicturePreview(response.data.profilePicture || picturePreview);
      setProfilePicture(null);
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update profile",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfilePicture(null);
    setPicturePreview(profileData?.profilePicture || null);
    setFormData({
      username: profileData.username || "",
      email: profileData.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMessage({ type: "", text: "" });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>My Profile</h1>

        <div className="profile-header">
          <div className="profile-picture-section">
            {picturePreview ? (
              <img 
                src={picturePreview} 
                alt="Profile" 
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {getInitials(profileData?.username)}
              </div>
            )}
            {isEditing && (
              <>
                <button 
                  type="button"
                  className="change-picture-btn"
                  onClick={() => document.getElementById('picture-input').click()}
                >
                  📷
                </button>
                <input
                  type="file"
                  id="picture-input"
                  className="picture-input"
                  accept="image/*"
                  onChange={handlePictureChange}
                />
              </>
            )}
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-info">
              <div className="profile-field">
                <label>Username:</label>
                <span>{profileData?.username}</span>
              </div>
              <div className="profile-field">
                <label>Email:</label>
                <span>{profileData?.email || "Not set"}</span>
              </div>
              <div className="profile-field">
                <label>Role:</label>
                <span className="role-badge">{profileData?.role}</span>
              </div>
              <div className="profile-field">
                <label>Member Since:</label>
                <span>
                  {profileData?.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </span>
              </div>
            </div>

            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Account Information</h3>
              
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength="3"
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-section password-section">
              <h3>Change Password</h3>
              <p className="section-note">Leave blank to keep current password</p>
              
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password:</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password:</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="save-btn">
                Save Changes
              </button>
              <button type="button" onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;