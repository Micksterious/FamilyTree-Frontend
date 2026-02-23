import React from "react";
import FamilyTreeVisualization from "./FamilyTreeVisualization";
import "../styles/FamilyTreeLayout.css";

const FamilyTreeLayout = ({ user }) => {
  return (
    <div className="family-tree-layout">
      <div className="tree-section">
        <FamilyTreeVisualization user={user} />
      </div>
    </div>
  );
};

export default FamilyTreeLayout;