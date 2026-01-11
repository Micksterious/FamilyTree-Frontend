import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "../styles/FamilyMembers.css";
import { API_URL } from "../shared";

function FamilyMembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    date_of_birth: "",
    sex: "",
  });
  const [editMember, setEditMember] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sexFilter, setSexFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // name, birthday, age

  const [user, setUser] = useState(null);
  const [countdown, setCountdown] = useState(null);

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
        fetchMembers();
      } catch (error) {
        console.error("Auth check failed:", error);
        alert("Your session has expired. Please log in again.");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchMembers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/api/familymembers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API_URL}/api/familymembers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({ firstname: "", lastname: "", date_of_birth: "", sex: "" });
      fetchMembers();
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this family member?"
    );
    if (!confirm) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/api/familymembers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMembers();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEditClick = (member) => {
    setEditMember({ ...member });
  };

  const handleEditChange = (e) => {
    setEditMember({ ...editMember, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
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

  // Calculate age helper
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filter and search members
  const getFilteredMembers = () => {
    let filtered = [...members];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.lastname.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sex filter
    if (sexFilter !== "all") {
      filtered = filtered.filter((m) => m.sex === sexFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const nameA = `${a.firstname} ${a.lastname}`.toLowerCase();
          const nameB = `${b.firstname} ${b.lastname}`.toLowerCase();
          return nameA.localeCompare(nameB);
        
        case "birthday":
          const dateA = new Date(a.date_of_birth);
          const dateB = new Date(b.date_of_birth);
          return dateA - dateB;
        
        case "age":
          return calculateAge(a.date_of_birth) - calculateAge(b.date_of_birth);
        
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredMembers = getFilteredMembers();

  function getNextBirthday(members) {
    const now = new Date();
    let closest = null;
    let minDiff = Infinity;

    members.forEach((member) => {
      if (!member.date_of_birth) return;

      const [year, month, day] = member.date_of_birth.split("-").map(Number);

      let nextBirthday = new Date(now.getFullYear(), month - 1, day, 12, 0, 0);

      if (nextBirthday < now) {
        nextBirthday = new Date(now.getFullYear() + 1, month - 1, day, 12, 0, 0);
      }

      const diff = nextBirthday - now;

      if (diff < minDiff) {
        minDiff = diff;
        closest = {
          ...member,
          nextBirthday,
        };
      }
    });

    return closest;
  }

  const nextBirthday = getNextBirthday(members);

  useEffect(() => {
    if (!nextBirthday?.nextBirthday) return;

    const interval = setInterval(() => {
      const now = new Date();
      let diff = nextBirthday.nextBirthday - now;

      if (diff <= 0) {
        clearInterval(interval);
        setCountdown("🎉 Today!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff %= 1000 * 60 * 60 * 24;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff %= 1000 * 60 * 60;

      const minutes = Math.floor(diff / (1000 * 60));
      diff %= 1000 * 60;

      const seconds = Math.floor(diff / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBirthday]);

  return (
    <>
      <div className="family-container">
        {nextBirthday && countdown && (
          <div className="next-birthday" style={{ whiteSpace: "nowrap" }}>
            🎉 Next birthday: {nextBirthday.firstname} {nextBirthday.lastname} — ⏳
            {typeof countdown === "string"
              ? ` ${countdown}`
              : ` ${countdown.days} days ${countdown.hours} hours ${countdown.minutes} mins ${countdown.seconds} seconds`}
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

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="birthday">Sort by Birthday</option>
            <option value="age">Sort by Age</option>
          </select>

          <div className="filter-info">
            Showing {filteredMembers.length} of {members.length} members
          </div>
        </div>

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
          {filteredMembers.map((m) => (
            <li key={m.id} className="family-item">
              <div className="family-info">
                {m.firstname} {m.lastname} ({m.sex}) —{" "}
                {new Date(m.date_of_birth).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                })}{" "}
                <span className="age-badge">Age: {calculateAge(m.date_of_birth)}</span>
              </div>
              <div className="family-actions">
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

        {filteredMembers.length === 0 && (
          <div className="no-results">
            No family members found matching your filters.
          </div>
        )}
      </div>
    </>
  );
}

export default FamilyMembersPage;