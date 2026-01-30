import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import "../styles/FamilyMembers.css";
import "../styles/Relationships.css";

const Relationships = () => {
  const [activeTab, setActiveTab] = useState("parentChild");
  const [relationships, setRelationships] = useState([]);
  const [spouses, setSpouses] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [parentChildForm, setParentChildForm] = useState({ parent_ids: [], child_ids: [] });
  const [spouseForm, setSpouseForm] = useState({ partner1_id: "", partner2_id: "" });
  const [user, setUser] = useState(null);
  const [editRel, setEditRel] = useState(null);
  const [editSpouse, setEditSpouse] = useState(null);
  const [parentSearch, setParentSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");
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
      const [relRes, spouseRes, membersRes] = await Promise.all([
        axios.get(`${API_URL}/api/relationships`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/spouses`, {
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/familymembers`, {
          withCredentials: true,
        }),
      ]);

      setRelationships(relRes.data);
      setSpouses(spouseRes.data);
      setFamilyMembers(membersRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Parent-Child Handlers
  const handleParentChange = (parentId) => {
    const currentIds = parentChildForm.parent_ids;
    if (currentIds.includes(parentId)) {
      setParentChildForm({
        ...parentChildForm,
        parent_ids: currentIds.filter(id => id !== parentId),
        child_ids: []
      });
    } else {
      setParentChildForm({
        ...parentChildForm,
        parent_ids: [parentId],
        child_ids: []
      });
    }
  };

  const handleChildCheckbox = (childId) => {
    const currentIds = parentChildForm.child_ids;
    if (currentIds.includes(childId)) {
      setParentChildForm({
        ...parentChildForm,
        child_ids: currentIds.filter(id => id !== childId)
      });
    } else {
      setParentChildForm({
        ...parentChildForm,
        child_ids: [...currentIds, childId]
      });
    }
  };

  const handleParentChildSubmit = async (e) => {
    e.preventDefault();
    const { parent_ids, child_ids } = parentChildForm;

    if (parent_ids.length === 0 || child_ids.length === 0) {
      alert("Please select at least one parent and one child");
      return;
    }

    try {
      if (editRel) {
        await axios.put(
          `${API_URL}/api/relationships/${editRel.parent_id}/${editRel.child_id}`,
          { parent_id: parent_ids[0], child_id: child_ids[0] },
          { withCredentials: true }
        );
        setEditRel(null);
      } else {
        for (const childId of child_ids) {
          await axios.post(
            `${API_URL}/api/relationships`,
            { parent_id: parent_ids[0], child_id: childId },
            { withCredentials: true }
          );
        }
      }
      setParentChildForm({ parent_ids: [], child_ids: [] });
      setParentSearch("");
      setChildSearch("");
      fetchData();
    } catch (err) {
      console.error("Error saving relationship:", err);
      alert(err.response?.data?.error || "Error saving relationship");
    }
  };

  // Spouse Handlers
  const handleSpouseSubmit = async (e) => {
    e.preventDefault();
    const { partner1_id, partner2_id } = spouseForm;

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
      setSpouseForm({ partner1_id: "", partner2_id: "" });
      fetchData();
    } catch (err) {
      console.error("Error saving spouse relationship:", err);
      alert(err.response?.data?.error || "Error saving spouse relationship");
    }
  };

  const handleEditRel = (rel) => {
    setEditRel(rel);
    setParentChildForm({ parent_ids: [rel.parent_id], child_ids: [rel.child_id] });
  };

  const handleEditSpouse = (spouse) => {
    setEditSpouse(spouse);
    setSpouseForm({ partner1_id: spouse.partner1_id, partner2_id: spouse.partner2_id });
  };

  const handleDeleteRel = async (parent_id, child_id) => {
    if (!window.confirm("Delete this relationship?")) return;

    try {
      await axios.delete(`${API_URL}/api/relationships/${parent_id}/${child_id}`, {
        withCredentials: true,
      });
      fetchData();
    } catch (err) {
      console.error("Error deleting relationship:", err);
      alert("Error deleting relationship");
    }
  };

  const handleDeleteSpouse = async (partner1_id, partner2_id) => {
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

  const filteredParents = familyMembers.filter((m) =>
    `${m.firstname} ${m.lastname}`.toLowerCase().includes(parentSearch.toLowerCase())
  );

  const filteredChildren = familyMembers.filter((m) =>
    `${m.firstname} ${m.lastname}`.toLowerCase().includes(childSearch.toLowerCase())
  );

  return (
    <div className="family-container">
      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "2rem",
        borderBottom: "2px solid #ddd",
      }}>
        <button
          onClick={() => setActiveTab("parentChild")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "parentChild" ? "#28a745" : "#f0f0f0",
            color: activeTab === "parentChild" ? "white" : "#333",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Parent-Child
        </button>
        <button
          onClick={() => setActiveTab("spouse")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "spouse" ? "#28a745" : "#f0f0f0",
            color: activeTab === "spouse" ? "white" : "#333",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Spouse
        </button>
      </div>

      {/* Tab Content Container */}
      <div style={{ minHeight: "800px" }}>
        {/* Parent-Child Tab */}
        {activeTab === "parentChild" && (
          <>
            <h2>{editRel ? "Edit Parent-Child Relationship" : "Add Parent-Child Relationship"}</h2>
          <form onSubmit={handleParentChildSubmit} className="relationship-form">
            <div className="form-row">
              <div className="form-column">
                <label>Parent:</label>
                <input
                  type="text"
                  placeholder="Search parent..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  list="parent-list"
                  className="search-input-small"
                />
                <datalist id="parent-list">
                  {filteredParents.map((member) => (
                    <option key={member.id} value={`${member.firstname} ${member.lastname}`}>
                      {member.id}
                    </option>
                  ))}
                </datalist>
                <select
                  value={parentChildForm.parent_ids[0] || ""}
                  onChange={(e) => handleParentChange(parseInt(e.target.value))}
                >
                  <option value="">Select parent</option>
                  {filteredParents.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-column">
                <label>Child:</label>
                <input
                  type="text"
                  placeholder="Search child..."
                  value={childSearch}
                  onChange={(e) => setChildSearch(e.target.value)}
                  list="child-list"
                  className="search-input-small"
                />
                <datalist id="child-list">
                  {filteredChildren.map((member) => (
                    <option key={member.id} value={`${member.firstname} ${member.lastname}`}>
                      {member.id}
                    </option>
                  ))}
                </datalist>
                <select
                  value={parentChildForm.child_ids[0] || ""}
                  onChange={(e) => handleChildCheckbox(parseInt(e.target.value))}
                >
                  <option value="">Select child</option>
                  {filteredChildren.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstname} {member.lastname}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn-primary">
                {editRel ? "Update Relationship" : "Add Relationship"}
              </button>
              {editRel && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditRel(null);
                    setParentChildForm({ parent_ids: [], child_ids: [] });
                    setParentSearch("");
                    setChildSearch("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2>Parent-Child Relationships</h2>
          {relationships.length === 0 ? (
            <p className="no-results">No parent-child relationships yet</p>
          ) : (
            <ul className="family-list">
              {relationships.map((rel) => {
                const parent = familyMembers.find((m) => m.id === rel.parent_id);
                const child = familyMembers.find((m) => m.id === rel.child_id);
                return (
                  <li key={`${rel.parent_id}-${rel.child_id}`} className="family-item">
                    <span className="family-info">
                      {parent?.firstname} {parent?.lastname} ➝ {child?.firstname} {child?.lastname}
                    </span>
                    <div className="family-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditRel(rel)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRel(rel.parent_id, rel.child_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Spouse Tab */}
      {activeTab === "spouse" && (
        <>
          <h2>{editSpouse ? "Edit Spouse Relationship" : "Add Spouse Relationship"}</h2>
          <form onSubmit={handleSpouseSubmit} className="family-form">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label htmlFor="partner1">Partner 1:</label>
                  <select
                    id="partner1"
                    value={spouseForm.partner1_id}
                    onChange={(e) => setSpouseForm({ ...spouseForm, partner1_id: parseInt(e.target.value) })}
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
                    value={spouseForm.partner2_id}
                    onChange={(e) => setSpouseForm({ ...spouseForm, partner2_id: parseInt(e.target.value) })}
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
                      setSpouseForm({ partner1_id: "", partner2_id: "" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

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
                        onClick={() => handleEditSpouse(spouse)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSpouse(spouse.partner1_id, spouse.partner2_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default Relationships;
