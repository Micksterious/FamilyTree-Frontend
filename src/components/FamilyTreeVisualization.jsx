import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { API_URL } from "../shared";
import "../styles/FamilyTreeVisualization.css";

cytoscape.use(dagre);

const FamilyTreeVisualization = () => {
  const [cy, setCy] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return `${monthName} ${day}, ${year}`;
  };

  const createLabel = (firstname, lastname, birthDate, deathDate) => {
    let label = `${firstname} ${lastname}`;
    if (birthDate) label += `\nb. ${formatDate(birthDate)}`;
    if (deathDate) label += `\nd. ${formatDate(deathDate)}`;
    return label;
  };

  useEffect(() => {
    const fetchFamilyTree = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/familymembers/tree/cytoscape`, {
          withCredentials: true,
        });

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

  useEffect(() => {
    if (!cy || elements.length === 0) return;

    const runLayout = async () => {
      const layout = cy.layout({
        name: "dagre",
        nodeSep: 120,
        rankSep: 180,
        rankDir: "TB",
        ranker: "network-simplex",
        animate: false,
      });

      layout.run();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Group nodes by generation (Y position) instead of just by parents
      const generationGroups = new Map();

      cy.nodes().forEach(node => {
        const parents = cy.edges(`[target = "${node.id()}"]`).sources();
        
        if (parents.length === 0) return; // Skip root nodes (grandparents)

        // Round Y position to group nodes in same generation
        const generation = Math.round(node.position().y / 100);
        
        if (!generationGroups.has(generation)) {
          generationGroups.set(generation, []);
        }
        generationGroups.get(generation).push(node);
      });

      // For each generation, group by shared parents (including half-siblings)
      generationGroups.forEach(nodesInGeneration => {
        // Find groups of siblings/half-siblings (those who share at least one parent)
        const processed = new Set();
        const siblingGroups = [];

        nodesInGeneration.forEach(node => {
          if (processed.has(node.id())) return;

          const group = [node];
          processed.add(node.id());

          const nodeParents = cy.edges(`[target = "${node.id()}"]`).sources().map(p => p.id());

          // Find all other nodes that share at least one parent
          nodesInGeneration.forEach(otherNode => {
            if (processed.has(otherNode.id())) return;

            const otherParents = cy.edges(`[target = "${otherNode.id()}"]`).sources().map(p => p.id());
            
            // Check if they share at least one parent
            const sharedParents = nodeParents.filter(p => otherParents.includes(p));
            
            if (sharedParents.length > 0) {
              group.push(otherNode);
              processed.add(otherNode.id());
            }
          });

          if (group.length > 0) {
            siblingGroups.push(group);
          }
        });

        // Sort and reposition each sibling group
        siblingGroups.forEach(siblings => {
          if (siblings.length <= 1) return;

          // Sort by birth date (oldest first)
          siblings.sort((a, b) => {
            const dateA = new Date(a.data('birthDate') || '9999-12-31');
            const dateB = new Date(b.data('birthDate') || '9999-12-31');
            return dateA - dateB;
          });

          // Get all X positions sorted
          const xPositions = siblings.map(s => s.position().x).sort((a, b) => a - b);
          const avgY = siblings.reduce((sum, s) => sum + s.position().y, 0) / siblings.length;

          // Assign positions left to right by age
          siblings.forEach((node, index) => {
            node.position({ x: xPositions[index], y: avgY });
          });
        });
      });

      cy.fit();
    };

    runLayout();
  }, [cy, elements]);

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
        "curve-style": "bezier",
      },
    },
    {
      selector: 'edge[type="spouse"]',
      style: {
        "target-arrow-shape": "none",
        "line-color": "#E84C9F",
        "line-style": "dashed",
        width: 3,
      },
    },
    {
      selector: 'edge[type="parent-child"]',
      style: {
        "target-arrow-shape": "triangle",
        "line-color": "#333",
      },
    },
  ];

  return (
    <div className="tree-container">
      {/* Legend */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        backgroundColor: "white",
        border: "2px solid #333",
        borderRadius: "8px",
        padding: "15px",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        fontSize: "14px",
      }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Legend</div>
        <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "2px", backgroundColor: "#333", position: "relative" }}>
            <div style={{ 
              position: "absolute", 
              right: "-5px", 
              top: "-4px", 
              width: "0", 
              height: "0",
              borderLeft: "6px solid transparent",
              borderRight: "0px solid transparent",
              borderTop: "6px solid #333",
              borderBottom: "0px solid transparent",
            }} />
          </div>
          <span>Parent-Child</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "3px", backgroundColor: "#E84C9F", backgroundImage: "repeating-linear-gradient(90deg, #E84C9F 0px, #E84C9F 5px, white 5px, white 10px)" }} />
          <span>Spouse</span>
        </div>
      </div>

      {elements.length > 0 ? (
        <CytoscapeComponent
          elements={elements}
          style={{
            width: "100%",
            height: "calc(100vh - 80px)",
          }}
          stylesheet={cytoStyle}
          cy={(cyInstance) => setCy(cyInstance)}
          autoungrabify={false}
        />
      ) : (
        <div>No family members to display</div>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;