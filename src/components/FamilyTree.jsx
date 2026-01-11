import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FamilyTreeLayout from "./FamilyTreeLayout";
import { API_URL } from "../shared";

function FamilyTree() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true,
        });
        if (!me.data?.user) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
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
