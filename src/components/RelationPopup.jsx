import React from "react";
import "../styles/RelationPopup.css";

const RelationPopup = ({ name, relation }) => {
  return (
    <div className="relation-popup">
      This is your <b>{relation}</b>!
      <div className="relation-name">{name}</div>
    </div>
  );
};

export default RelationPopup;
