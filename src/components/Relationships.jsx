import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import "../styles/FamilyMembers.css";

const Relationships = () => {
  const [relationships, setRelationships] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [formData, setFormData] = useState({ parent_id: "", child_id: "" });
  const [user, setUser] = useState(null);
  const [editRel, setEditRel] = useState(null);
  const navigate = useNavigate();

    const token = localStorage.getItem('token'); // ← ADD THIS LINE

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.data) {
          navigate("/login");
          return;
        }

        // Set user here too!
        setUser(response.data); // ← ADD THIS

        fetchData();
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate, token]);

  // ... rest of your component

  const fetchData = async () => {
    try {
      const [relRes, membersRes] = await Promise.all([
        axios.get(`${API_URL}/api/relationships`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/familymembers`, {
          withCredentials: true,
        }),
      ]);

      setRelationships(relRes.data);
      setFamilyMembers(membersRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.parent_id === formData.child_id) {
      alert("Parent and child can't be the same.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/relationships`, formData, {
        withCredentials: true,
      });
      setFormData({ parent_id: "", child_id: "" });
      fetchData();
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleDelete = async (parent_id, child_id) => {
    const confirm = window.confirm("Are you sure you want to delete this relationship?");
    if (!confirm) return;

    try {
      await axios.delete(`${API_URL}/api/relationships/${parent_id}/${child_id}`, {
        withCredentials: true,
      });
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { parent_id, child_id, new_parent_id, new_child_id } = editRel;

    if (new_parent_id === new_child_id) {
      alert("Parent and child can't be the same.");
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/relationships/${parent_id}/${child_id}`,
        {
          new_parent_id: new_parent_id || parent_id,
          new_child_id: new_child_id || child_id,
        },
        {
          withCredentials: true,
        }
      );
      setEditRel(null);
      fetchData();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const getMemberName = (id) => {
    const member = familyMembers.find((m) => m.id === id);
    return member ? `${member.firstname} ${member.lastname}` : `Unknown`;
  };

  return (
    <div className="family-container">
      <h2>Relationships</h2>

      {/* Create Relationship Form */}
      <form onSubmit={handleCreate} className="family-form">
        <select name="parent_id" value={formData.parent_id} onChange={handleChange}>
          <option value="">Select Parent</option>
          {familyMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstname} {m.lastname}
            </option>
          ))}
        </select>

        <select name="child_id" value={formData.child_id} onChange={handleChange}>
          <option value="">Select Child</option>
          {familyMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstname} {m.lastname}
            </option>
          ))}
        </select>

        <button type="submit">Add Relationship</button>
      </form>

      {/* Edit Relationship Form */}
      {editRel && (
        <form onSubmit={handleUpdate} className="family-form">
          <select
            value={editRel.new_parent_id || editRel.parent_id}
            onChange={(e) =>
              setEditRel({ ...editRel, new_parent_id: e.target.value })
            }
          >
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstname} {m.lastname}
              </option>
            ))}
          </select>

          <select
            value={editRel.new_child_id || editRel.child_id}
            onChange={(e) =>
              setEditRel({ ...editRel, new_child_id: e.target.value })
            }
          >
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstname} {m.lastname}
              </option>
            ))}
          </select>

          <button type="submit">Update</button>
          <button type="button" onClick={() => setEditRel(null)}>
            Cancel
          </button>
        </form>
      )}

      {/* Relationships List */}
      <ul className="family-list">
        {relationships.map((rel, index) => (
          <li key={index} className="family-item">
            <div className="family-info">
              {getMemberName(rel.parent_id)} ➝ {getMemberName(rel.child_id)}
            </div>
            <div className="family-actions">
  {console.log("Button check - user:", user, "role:", user?.role, "equals admin?", user?.role === "admin")}
  {user?.role === "admin" && (
    <>
      <button
        className="edit-btn"
        onClick={() =>
          setEditRel({
            parent_id: rel.parent_id,
            child_id: rel.child_id,
          })
        }
      >
        Edit
      </button>
      <button
        className="delete-btn"
        onClick={() => handleDelete(rel.parent_id, rel.child_id)}
      >
        Delete
      </button>
    </>
  )}
</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Relationships;
