import React from "react";
import FamilyTreeVisualization from "./FamilyTreeVisualization";
import "../styles/FamilyTreeLayout.css";

const FamilyTreeLayout = () => {
  return (
    <div className="family-tree-layout">
      <div className="tree-section">
        <FamilyTreeVisualization />
      </div>
    </div>
  );
};

export default FamilyTreeLayout;
