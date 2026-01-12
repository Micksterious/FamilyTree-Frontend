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
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${day}, ${year}`;
  };

  // Helper function to create label with dates
  const createLabel = (firstname, lastname, birthDate, deathDate) => {
    let label = `${firstname} ${lastname}`;
    
    if (birthDate) {
      label += `\nb. ${formatDate(birthDate)}`;
    }
    
    if (deathDate) {
      label += `\nd. ${formatDate(deathDate)}`;
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
              node.data.firstname,
              node.data.lastname,
              node.data.birthDate,
              node.data.deathDate
            ),
          }
        }));

        // Sort nodes by birth date to help dagre layout
        processedNodes.sort((a, b) => {
          const dateA = a.data.birthDate ? new Date(a.data.birthDate) : new Date('9999-12-31');
          const dateB = b.data.birthDate ? new Date(b.data.birthDate) : new Date('9999-12-31');
          return dateA - dateB;
        });

        // Sort edges to match the node order
        const nodeOrder = processedNodes.map(n => n.data.id);
        const sortedEdges = response.data.edges.sort((a, b) => {
          const aTargetIndex = nodeOrder.indexOf(a.data.target);
          const bTargetIndex = nodeOrder.indexOf(b.data.target);
          return aTargetIndex - bTargetIndex;
        });

        setElements([...processedNodes, ...sortedEdges]);
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
        width: 90,
        height: 90,
        "text-valign": "center",
        "text-halign": "center",
        "font-size": 9,
        color: "#ffffff",
        "text-wrap": "wrap",
        "text-max-width": 85,
        "font-weight": "normal",
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
    nodeSep: 120,
    rankSep: 180,
    rankDir: "TB",
    ranker: "network-simplex", // Changed from tight-tree
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