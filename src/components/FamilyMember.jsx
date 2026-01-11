import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import "../styles/FamilyMembers.css"; // Import your CSS file
import { API_URL } from "../shared";

function FamilyMembersPage() {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    date_of_birth: "",
    sex: "",
  });
  const [editMember, setEditMember] = useState(null); // ✅ added

  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/familymembers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/familymembers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({ firstname: "", lastname: "", date_of_birth: "", sex: "" });
      fetchMembers(); // refresh list
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this family member?"
    );
    if (!confirm) return;

    try {
      await axios.delete(`${API_URL}/api/familymembers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMembers(); // refresh the list
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEditClick = (member) => {
    setEditMember({ ...member }); // ✅ set form values to member
  };

  const handleEditChange = (e) => {
    setEditMember({ ...editMember, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/familymembers/${editMember.id}`,
        editMember,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditMember(null);
      fetchMembers();
    } catch (err) {
      console.error("Update error:", err);
    }
  };
  // Function to get Next Birthday
  function getNextBirthday(members) {
    const today = new Date();
    let closest = null;
    let minDiff = Infinity;

    members.forEach((member) => {
      const dob = new Date(member.date_of_birth);
      const thisYear = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate()
      );

      // If birthday already passed this year, use next year
      const nextBirthday =
        thisYear < today
          ? new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
          : thisYear;

      const diff = nextBirthday - today;
      if (diff < minDiff) {
        minDiff = diff;
        closest = {
          ...member,
          daysUntil: Math.ceil(diff / (1000 * 60 * 60 * 24)),
        };
      }
    });

    return closest;
  }

  const nextBirthday = getNextBirthday(members);

  return (
    <>
      <div className="family-container">
        {nextBirthday && (
          <div
            style={{
              background: "#f0f9e8",
              border: "1px solid #c3e6cb",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            🎉 Next birthday: {nextBirthday.firstname} {nextBirthday.lastname} —
            in {nextBirthday.daysUntil} day(s)!
          </div>
        )}
        <h2>Family Members</h2>

        {/* Create Form */}
        <form className="family-form" onSubmit={handleCreate}>
          <input
            name="firstname"
            placeholder="First Name"
            value={formData.firstname}
            onChange={handleChange}
          />
          <input
            name="lastname"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={handleChange}
          />
          <input
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
          />
          <select name="sex" value={formData.sex} onChange={handleChange}>
            <option value="">Select Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <button type="submit">Add Member</button>
        </form>

        {/* Edit Form */}
        {editMember && (
          <form className="family-form" onSubmit={handleUpdate}>
            <h3>
              Editing: {editMember.firstname} {editMember.lastname}
            </h3>
            <input
              name="firstname"
              value={editMember.firstname}
              onChange={handleEditChange}
            />
            <input
              name="lastname"
              value={editMember.lastname}
              onChange={handleEditChange}
            />
            <input
              type="date"
              name="date_of_birth"
              value={editMember.date_of_birth?.slice(0, 10)}
              onChange={handleEditChange}
            />
            <select
              name="sex"
              value={editMember.sex}
              onChange={handleEditChange}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <button type="submit">Update Member</button>
            <button type="button" onClick={() => setEditMember(null)}>
              Cancel
            </button>
          </form>
        )}

        {/* Member List */}
        <ul className="family-list">
          {members.map((m) => (
            <li key={m.id} className="family-item">
              <div className="family-info">
                {m.firstname} {m.lastname} ({m.sex}) —{" "}
                {new Date(m.date_of_birth).toLocaleDateString()}
              </div>
              <div className="family-actions">
              {console.log("Button check - user:", user, "role:", user?.role, "equals admin?", user?.role === "admin")}
                {user?.role === "admin" && (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(m)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(m.id)}
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
    </>
  );
}

export default FamilyMembersPage;
