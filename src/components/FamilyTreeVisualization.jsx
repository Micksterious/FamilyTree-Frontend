import React, { useEffect, useState } from "react";
import RelationPopup from "./RelationPopup";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { API_URL } from "../shared";
import "../styles/FamilyTreeVisualization.css";

cytoscape.use(dagre);

const FamilyTreeVisualization = ({ user }) => {
  const [cy, setCy] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showParentChild, setShowParentChild] = useState(true);
  const [showSpouses, setShowSpouses] = useState(true);
  const [showCousin1, setShowCousin1] = useState(true);
  const [showCousin2, setShowCousin2] = useState(true);
  const [showCousin3, setShowCousin3] = useState(true);
  const [userFamilyMemberId, setUserFamilyMemberId] = useState(null);
  const [popup, setPopup] = useState(null);

  // Fetch familyMemberId from /api/users/me using the authenticated user's id.
  // We do this separately from the JWT payload because familyMemberId is stored
  // in the DB, not encoded in the token.
// Before (remove this entire block):
useEffect(() => {
  const fetchFamilyMemberId = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserFamilyMemberId(response.data.familyMemberId);
    } catch (e) {
      console.error("Could not fetch familyMemberId:", e);
      setUserFamilyMemberId(null);
    }
  };
  fetchFamilyMemberId();
  console.log("👤 user prop:", user);
  console.log("🆔 familyMemberId:", user?.familyMemberId);
}, [user]);

// After (replace with this):
useEffect(() => {
  if (user?.familyMemberId) {
    setUserFamilyMemberId(user.familyMemberId);
  }
}, [user]);

  // Hover logic for user's own node
  useEffect(() => {
    if (!cy || !userFamilyMemberId) return;
    let popupTimeout = null;
    const handler = (event) => {
  const node = event.target;
  console.log("🖱️ hovered node id:", String(node.id()));
  console.log("🆔 userFamilyMemberId:", String(userFamilyMemberId));
  console.log("✅ match:", String(node.id()) === `member-${userFamilyMemberId}`);
  if (String(node.id()) === `member-${userFamilyMemberId}`) {
  const pos = node.renderedPosition();
  console.log("🎉 MATCH FOUND, setting popup at:", pos);
  setPopup({
    x: pos.x,
    y: pos.y,
    name: node.data('firstname') + ' ' + node.data('lastname'),
    relation: 'profile',
  });
}
};
    const outHandler = (event) => {
  if (String(event.target.id()) === `member-${userFamilyMemberId}`) {
    popupTimeout = setTimeout(() => setPopup(null), 100);
  }
};
    cy.on('mouseover', 'node', handler);
    cy.on('mouseout', 'node', outHandler);
    return () => {
      cy.off('mouseover', 'node', handler);
      cy.off('mouseout', 'node', outHandler);
      if (popupTimeout) clearTimeout(popupTimeout);
    };
  }, [cy, userFamilyMemberId]);

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

      const generationGroups = new Map();

      cy.nodes().forEach(node => {
        const parents = cy.edges(`[target = "${node.id()}"]`).sources();
        if (parents.length === 0) return;
        const generation = Math.round(node.position().y / 100);
        if (!generationGroups.has(generation)) {
          generationGroups.set(generation, []);
        }
        generationGroups.get(generation).push(node);
      });

      generationGroups.forEach(nodesInGeneration => {
        const processed = new Set();
        const siblingGroups = [];

        nodesInGeneration.forEach(node => {
          if (processed.has(node.id())) return;

          const group = [node];
          processed.add(node.id());

          const nodeParents = cy.edges(`[target = "${node.id()}"]`).sources().map(p => p.id());

          nodesInGeneration.forEach(otherNode => {
            if (processed.has(otherNode.id())) return;

            const otherParents = cy.edges(`[target = "${otherNode.id()}"]`).sources().map(p => p.id());
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

        siblingGroups.forEach(siblings => {
          if (siblings.length <= 1) return;

          siblings.sort((a, b) => {
            const dateA = new Date(a.data('birthDate') || '9999-12-31');
            const dateB = new Date(b.data('birthDate') || '9999-12-31');
            return dateA - dateB;
          });

          const xPositions = siblings.map(s => s.position().x).sort((a, b) => a - b);
          const avgY = siblings.reduce((sum, s) => sum + s.position().y, 0) / siblings.length;

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

  const filteredElements = elements.filter(el => {
    if (el.data?.type === "parent-child" && !showParentChild) return false;
    if (el.data?.type === "spouse" && !showSpouses) return false;
    return true;
  });

  return (
    <div className="tree-container" style={{position: 'relative'}}>
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
          <input
            type="checkbox"
            checked={showParentChild}
            onChange={(e) => setShowParentChild(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
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
          <input
            type="checkbox"
            checked={showSpouses}
            onChange={(e) => setShowSpouses(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ width: "30px", height: "3px", backgroundColor: "#E84C9F", backgroundImage: "repeating-linear-gradient(90deg, #E84C9F 0px, #E84C9F 5px, white 5px, white 10px)" }} />
          <span>Spouse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <input
            type="checkbox"
            checked={showCousin1}
            onChange={e => setShowCousin1(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ width: "30px", height: "3px", backgroundColor: "#FFD700" }} />
          <span>1st Cousin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
          <input
            type="checkbox"
            checked={showCousin2}
            onChange={e => setShowCousin2(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ width: "30px", height: "3px", backgroundColor: "#40E0D0" }} />
          <span>2nd Cousin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
          <input
            type="checkbox"
            checked={showCousin3}
            onChange={e => setShowCousin3(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ width: "30px", height: "3px", backgroundColor: "#FF69B4" }} />
          <span>3rd Cousin</span>
        </div>
      </div>

      {elements.length > 0 ? (
        <>
          <CytoscapeComponent
            elements={filteredElements}
            style={{ width: "100%", height: "calc(100vh - 80px)" }}
            stylesheet={cytoStyle}
            cy={(cyInstance) => setCy(cyInstance)}
            autoungrabify={false}
          />
          {popup && (
  <div style={{
    position: 'fixed',
    left: popup.x + 30,
    top: popup.y - 30,
    pointerEvents: 'none',
    zIndex: 9999,
  }}>
    {console.log("🎨 rendering popup:", popup)}
    <RelationPopup name={popup.name} relation={"profile"} />
  </div>
)}
        </>
      ) : (
        <div>No family members to display</div>
      )}
    </div>
  );
};

export default FamilyTreeVisualization;