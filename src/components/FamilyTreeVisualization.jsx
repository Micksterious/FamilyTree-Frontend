import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { API_URL } from "../shared";
import "../styles/FamilyTreeVisualization.css";

// Register the dagre layout
cytoscape.use(dagre);

const FamilyTreeVisualization = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFamilyTree = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/familymembers/tree/cytoscape`, {
          withCredentials: true,
        });
        setElements([...response.data.nodes, ...response.data.edges]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching family tree:", err);
        setError("Failed to load family tree");
        setLoading(false);
      }
    };

    fetchFamilyTree();
  }, []);

  if (loading) return <div className="tree-container">Loading family tree...</div>;
  if (error) return <div className="tree-container error">{error}</div>;

  const cytoStyle = [
    {
      selector: "node",
      style: {
        "background-color": (ele) => {
          const sex = ele.data("sex");
          if (sex === "male") return "#4A90E2";
          if (sex === "female") return "#E24A4A";
          return "#90E24A";
        },
        label: "data(label)",
        width: 60,
        height: 60,
        "text-valign": "center",
        "text-halign": "center",
        "font-size": 11,
        color: "#ffffff",
        "text-wrap": "wrap",
      },
    },
    {
      selector: "edge",
      style: {
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#333",
        "line-color": "#333",
        width: 2,
      },
    },
  ];

  const layout = {
    name: "dagre",
    nodeSep: 80,
    rankSep: 150,
    rankDir: "TB", // Top-to-bottom layout
  };

  return (
    <div className="tree-container">
      {elements.length > 0 ? (
        <CytoscapeComponent
          elements={elements}
          style={{
            width: "100%",
            height: "calc(100vh - 80px)",
          }}
          stylesheet={cytoStyle}
          layout={layout}
        />
      ) : (
        <div>No family members to display</div>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;
