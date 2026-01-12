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

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to create label with dates
  const createLabel = (name, birthDate, deathDate) => {
    let label = name;
    if (birthDate) {
      const birth = formatDate(birthDate);
      label += `\nb. ${birth}`;
    }
    if (deathDate) {
      const death = formatDate(deathDate);
      label += `\nd. ${death}`;
    }
    return label;
  };

  useEffect(() => {
    const fetchFamilyTree = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/familymembers/tree/cytoscape`, {
          withCredentials: true,
        });
        
        // Process nodes to add formatted labels with dates
        const processedNodes = response.data.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            label: createLabel(
              node.data.label || node.data.name,
              node.data.birthDate,
              node.data.deathDate
            ),
            birthDate: node.data.birthDate,
            deathDate: node.data.deathDate,
          }
        }));

        setElements([...processedNodes, ...response.data.edges]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching family tree:", err);
        setError("Failed to load family tree");
        setLoading(false);
      }
    };

    fetchFamilyTree();
  }, []);

  // Custom sorting function for dagre layout
  const handleCyReady = (cy) => {
    // Sort siblings by birth date before layout
    cy.nodes().forEach((node) => {
      const parent = node.parent();
      if (parent.length > 0) {
        const siblings = parent.children();
        siblings.sort((a, b) => {
          const dateA = a.data("birthDate") ? new Date(a.data("birthDate")) : new Date("9999-12-31");
          const dateB = b.data("birthDate") ? new Date(b.data("birthDate")) : new Date("9999-12-31");
          return dateA - dateB; // oldest to youngest (left to right)
        });
      }
    });
  };

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
        width: 80,
        height: 80,
        "text-valign": "center",
        "text-halign": "center",
        "font-size": 10,
        color: "#ffffff",
        "text-wrap": "wrap",
        "text-max-width": 75,
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
    nodeSep: 100,
    rankSep: 180,
    rankDir: "TB",
    // Custom ranker to sort siblings by birth date
    ranker: "tight-tree",
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
          cy={(cy) => handleCyReady(cy)}
        />
      ) : (
        <div>No family members to display</div>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;