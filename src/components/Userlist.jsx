import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/FamilyMembers.css";
import { API_URL } from "../shared";

function Userlist() {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Add admin check
  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data.role !== 'admin') {
          alert("Access denied - Admin only");
          navigate("/");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate, token]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error("Expected array, got:", res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;

    try {
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditUser({ ...user });
  };

  const handleEditChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/users/${editUser.id}`,
        {
          username: editUser.username,
          email: editUser.email,
          role: editUser.role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.error || "Failed to update user");
    }
  };

  return (
    <div className="family-container">
      <h2>User Management</h2>

      {/* Edit Form */}
      {editUser && (
        <form className="family-form" onSubmit={handleUpdate}>
          <h3>Editing: {editUser.username}</h3>
          <input
            name="username"
            placeholder="Username"
            value={editUser.username}
            onChange={handleEditChange}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={editUser.email}
            onChange={handleEditChange}
          />
          <select
            name="role"
            value={editUser.role}
            onChange={handleEditChange}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit">Update User</button>
          <button type="button" onClick={() => setEditUser(null)}>
            Cancel
          </button>
        </form>
      )}

      {/* User List */}
      <ul className="family-list">
        {users && users.length > 0 ? (
          users.map((user) => (
            <li key={user.id} className="family-item">
              <div className="family-info">
                <strong>{user.username}</strong> ({user.email}) — Role: {user.role || 'user'}
                <br />
                <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="family-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(user)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="family-item">No users found</li>
        )}
      </ul>
    </div>
  );
}

export default Userlist;