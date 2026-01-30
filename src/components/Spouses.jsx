import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import "../styles/FamilyMembers.css";

const Spouses = () => {
  const [spouses, setSpouses] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [formData, setFormData] = useState({ partner1_id: "", partner2_id: "" });
  const [user, setUser] = useState(null);
  const [editSpouse, setEditSpouse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("You must be logged in to view this page.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data) {
          alert("You must be logged in to view this page.");
          navigate("/login");
          return;
        }

        setUser(response.data);
        fetchData();
      } catch (err) {
        console.error("Auth error:", err);
        alert("Your session has expired. Please log in again.");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const spousesRes = await axios.get(`${API_URL}/api/spouses`, {
        withCredentials: true,
      });
      const membersRes = await axios.get(`${API_URL}/api/familymembers`, {
        withCredentials: true,
      });

      setSpouses(spousesRes.data || []);
      setFamilyMembers(membersRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { partner1_id, partner2_id } = formData;

    if (!partner1_id || !partner2_id) {
      alert("Please select both partners");
      return;
    }

    if (partner1_id === partner2_id) {
      alert("A person cannot be married to themselves");
      return;
    }

    try {
      if (editSpouse) {
        await axios.put(
          `${API_URL}/api/spouses/${editSpouse.partner1_id}/${editSpouse.partner2_id}`,
          { partner1_id, partner2_id },
          { withCredentials: true }
        );
        setEditSpouse(null);
      } else {
        await axios.post(
          `${API_URL}/api/spouses`,
          { partner1_id, partner2_id },
          { withCredentials: true }
        );
      }
      setFormData({ partner1_id: "", partner2_id: "" });
      fetchData();
    } catch (err) {
      console.error("Error saving spouse relationship:", err);
      alert(err.response?.data?.error || "Error saving spouse relationship");
    }
  };

  const handleEdit = (spouse) => {
    setEditSpouse(spouse);
    setFormData({ partner1_id: spouse.partner1_id, partner2_id: spouse.partner2_id });
  };

  const handleDelete = async (partner1_id, partner2_id) => {
    if (!window.confirm("Delete this spouse relationship?")) return;

    try {
      await axios.delete(`${API_URL}/api/spouses/${partner1_id}/${partner2_id}`, {
        withCredentials: true,
      });
      fetchData();
    } catch (err) {
      console.error("Error deleting spouse relationship:", err);
      alert("Error deleting spouse relationship");
    }
  };

  return (
    <div>
      <div className="family-container">
        <h2>Add Spouse Relationship</h2>
        <form onSubmit={handleSubmit} className="family-form">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label htmlFor="partner1">Partner 1:</label>
                <select
                  id="partner1"
                  value={formData.partner1_id}
                  onChange={(e) => setFormData({ ...formData, partner1_id: parseInt(e.target.value) })}
                  className="filter-select"
                >
                  <option value="">Select partner 1</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <label htmlFor="partner2">Partner 2:</label>
                <select
                  id="partner2"
                  value={formData.partner2_id}
                  onChange={(e) => setFormData({ ...formData, partner2_id: parseInt(e.target.value) })}
                  className="filter-select"
                >
                  <option value="">Select partner 2</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="family-form button" style={{ backgroundColor: "#28a745" }}>
                {editSpouse ? "Update Relationship" : "Add Relationship"}
              </button>
              {editSpouse && (
                <button
                  type="button"
                  className="family-form button"
                  style={{ backgroundColor: "#6c757d" }}
                  onClick={() => {
                    setEditSpouse(null);
                    setFormData({ partner1_id: "", partner2_id: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="family-container">
        <h2>Spouse Relationships</h2>
        {spouses.length === 0 ? (
          <p className="no-results">No spouse relationships yet</p>
        ) : (
          <ul className="family-list">
            {spouses.map((spouse) => {
              const partner1 = familyMembers.find((m) => m.id === spouse.partner1_id);
              const partner2 = familyMembers.find((m) => m.id === spouse.partner2_id);
              return (
                <li key={`${spouse.partner1_id}-${spouse.partner2_id}`} className="family-item">
                  <span className="family-info">
                    {partner1?.firstname} {partner1?.lastname} ♥ {partner2?.firstname} {partner2?.lastname}
                  </span>
                  <div className="family-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(spouse)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(spouse.partner1_id, spouse.partner2_id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Spouses;
