import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import NavBar from "./NavBar";
import "../styles/FamilyMembers.css";
import "../styles/Relationships.css";

const Relationships = () => {
  const [relationships, setRelationships] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [formData, setFormData] = useState({ parent_ids: [], child_ids: [] });
  const [user, setUser] = useState(null);
  const [editRel, setEditRel] = useState(null);
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

  const handleParentChange = (parentId) => {
    const currentIds = formData.parent_ids;
    if (currentIds.includes(parentId)) {
      setFormData({
        ...formData,
        parent_ids: currentIds.filter(id => id !== parentId),
        child_ids: []
      });
    } else {
      setFormData({
        ...formData,
        parent_ids: [parentId], // Only allow one parent at a time
        child_ids: []
      });
    }
  };

  const handleChildCheckbox = (childId) => {
    const currentIds = formData.child_ids;
    if (currentIds.includes(childId)) {
      setFormData({
        ...formData,
        child_ids: currentIds.filter(id => id !== childId)
      });
    } else {
      setFormData({
        ...formData,
        child_ids: [...currentIds, childId]
      });
    }
  };

  const handleSelectAll = () => {
    const availableFiltered = filteredChildren.map(m => m.id.toString());
    
    if (formData.child_ids.length === availableFiltered.length) {
      setFormData({ ...formData, child_ids: [] });
    } else {
      setFormData({ ...formData, child_ids: availableFiltered });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (formData.parent_ids.length === 0) {
      alert("Please select a parent.");
      return;
    }

    if (formData.child_ids.length === 0) {
      alert("Please select at least one child.");
      return;
    }

    const parentId = formData.parent_ids[0];

    try {
      await Promise.all(
        formData.child_ids.map(child_id =>
          axios.post(
            `${API_URL}/api/relationships`, 
            { parent_id: parentId, child_id }, 
            { withCredentials: true }
          )
        )
      );
      
      alert(`Successfully added ${formData.child_ids.length} relationship(s)!`);
      setFormData({ parent_ids: [], child_ids: [] });
      fetchData();
    } catch (err) {
      console.error("Create error:", err);
      alert("Error creating relationships. Some may already exist.");
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

  const availableChildren = familyMembers.filter(
    m => !formData.parent_ids.includes(m.id.toString())
  );

  // Filter parents by search
  const filteredParents = familyMembers.filter(m => {
    const fullName = `${m.firstname} ${m.lastname}`.toLowerCase();
    return fullName.includes(parentSearch.toLowerCase());
  });

  // Filter children by search
  const filteredChildren = availableChildren.filter(m => {
    const fullName = `${m.firstname} ${m.lastname}`.toLowerCase();
    return fullName.includes(childSearch.toLowerCase());
  });

  return (
    <div className="family-container">
      <h2>Relationships</h2>

      {/* Create Relationship Form */}
      <form onSubmit={handleCreate} className="relationship-form">
        <div className="form-row">
          <div className="form-column">
            <div className="checkbox-header">
              <label>Select Parent ({formData.parent_ids.length} selected)</label>
            </div>

            <input
              type="text"
              className="search-input-small"
              placeholder="🔍 Search parents..."
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
            />
            
            <div className="checkbox-container">
              {filteredParents.length === 0 ? (
                <div className="checkbox-placeholder">
                  {parentSearch ? 'No matches found' : 'No family members available'}
                </div>
              ) : (
                filteredParents.map((m) => (
                  <label key={m.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      value={m.id}
                      checked={formData.parent_ids.includes(m.id.toString())}
                      onChange={() => handleParentChange(m.id.toString())}
                    />
                    <span className="checkbox-label">
                      {m.firstname} {m.lastname}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="form-column">
            <div className="checkbox-header">
              <label>Select Children ({formData.child_ids.length} selected)</label>
              {formData.parent_ids.length > 0 && filteredChildren.length > 0 && (
                <button 
                  type="button" 
                  className="select-all-btn"
                  onClick={handleSelectAll}
                >
                  {formData.child_ids.length === filteredChildren.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <input
              type="text"
              className="search-input-small"
              placeholder="🔍 Search children..."
              value={childSearch}
              onChange={(e) => setChildSearch(e.target.value)}
            />
            
            <div className="checkbox-container">
              {formData.parent_ids.length === 0 ? (
                <div className="checkbox-placeholder">
                  Please select a parent first
                </div>
              ) : filteredChildren.length === 0 ? (
                <div className="checkbox-placeholder">
                  {childSearch ? 'No matches found' : 'No other family members available'}
                </div>
              ) : (
                filteredChildren.map((m) => (
                  <label key={m.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      value={m.id}
                      checked={formData.child_ids.includes(m.id.toString())}
                      onChange={() => handleChildCheckbox(m.id.toString())}
                    />
                    <span className="checkbox-label">
                      {m.firstname} {m.lastname}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={formData.parent_ids.length === 0 || formData.child_ids.length === 0}
        >
          Add {formData.child_ids.length > 0 ? formData.child_ids.length : ''} Relationship{formData.child_ids.length !== 1 ? 's' : ''}
        </button>
      </form>

      {/* Edit Relationship Form */}
      {editRel && (
        <form onSubmit={handleUpdate} className="family-form">
          <h3 style={{ width: '100%', marginBottom: '10px' }}>
            Edit Relationship
          </h3>
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