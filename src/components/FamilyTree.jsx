import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FamilyTreeLayout from "./FamilyTreeLayout";
import { API_URL } from "../shared";

function FamilyTree() {
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
      } catch (error) {
        console.error("Auth check failed:", error);
        alert("Your session has expired. Please log in again.");
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <>
      <FamilyTreeLayout />
    </>
  );
}

export default FamilyTree;