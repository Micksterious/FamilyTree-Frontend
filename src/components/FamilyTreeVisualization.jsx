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

  // ── Couple-node injection ────────────────────────────────────────────────
  // For each spouse pair, create a tiny invisible "couple node" placed between
  // them. All parent-child edges that originated from either spouse are
  // re-routed to come FROM the couple node. Classic look: horizontal spouse
  // line with one drop-point in the middle, children branching straight down.
  const injectCoupleNodes = (rawNodes, rawEdges) => {
    const spouseEdges  = rawEdges.filter(e => e.data?.type === "spouse");
    const pcEdges      = rawEdges.filter(e => e.data?.type === "parent-child");
    const otherEdges   = rawEdges.filter(e => e.data?.type !== "spouse" && e.data?.type !== "parent-child");

    // memberId -> Set of child ids
    const childrenOf = new Map();
    pcEdges.forEach(e => {
      const p = String(e.data.source);
      const c = String(e.data.target);
      if (!childrenOf.has(p)) childrenOf.set(p, new Set());
      childrenOf.get(p).add(c);
    });

    const coupleNodes   = [];
    const coupleEdges   = [];
    const coupleToChild = [];
    const reRouted      = new Set(); // "parentId-childId" keys already handled

    spouseEdges.forEach(spouseEdge => {
      const p1       = String(spouseEdge.data.source);
      const p2       = String(spouseEdge.data.target);
      const coupleId = `couple-${p1}-${p2}`;

      const p1Children = childrenOf.get(p1) || new Set();
      const p2Children = childrenOf.get(p2) || new Set();

      // Only children recorded under BOTH parents flow through the couple node.
      // Half-siblings (only one parent in the DB) keep a direct arrow from
      // whichever parent IS recorded — they are not re-routed here.
      const sharedChildren = new Set([...p1Children].filter(c => p2Children.has(c)));

      // Invisible couple node — always created so the spouse line has a midpoint
      coupleNodes.push({ data: { id: coupleId, type: "couple", label: "" } });

      // Each spouse connects TO the couple node (replaces the original spouse edge)
      coupleEdges.push({ data: { id: `se-${p1}-${coupleId}`, source: p1, target: coupleId, type: "spouse" } });
      coupleEdges.push({ data: { id: `se-${p2}-${coupleId}`, source: p2, target: coupleId, type: "spouse" } });

      // Couple node -> shared children only
      sharedChildren.forEach(childId => {
        coupleToChild.push({
          data: { id: `cc-${coupleId}-${childId}`, source: coupleId, target: childId, type: "parent-child" },
        });
        reRouted.add(`${p1}-${childId}`);
        reRouted.add(`${p2}-${childId}`);
      });
    });

    // Keep original parent-child edges only for parents with no spouse recorded
    const remainingPc = pcEdges.filter(e => !reRouted.has(`${e.data.source}-${e.data.target}`));

    return [...rawNodes, ...coupleNodes, ...coupleEdges, ...coupleToChild, ...remainingPc, ...otherEdges];
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

        const withCoupleNodes = injectCoupleNodes(processedNodes, response.data.edges);
        setElements(withCoupleNodes);
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
      // Run dagre — couple nodes are tiny so they won't disrupt ranks much;
      // spouse edges have zero weight so they don't affect vertical placement.
      const layout = cy.layout({
        name: "dagre",
        nodeSep: 130,
        rankSep: 200,
        rankDir: "TB",
        ranker: "network-simplex",
        animate: false,
        edgeWeight: (edge) => edge.data('type') === 'spouse' ? 0 : 1,
      });

      layout.run();
      await new Promise(resolve => setTimeout(resolve, 200));

      // ── Step 1: Snap every NON-couple node to clean generation rows ───────
      const BAND = 200;
      const memberNodes = cy.nodes().filter(n => n.data('type') !== 'couple');
      const rawYs = memberNodes.map(n => n.position().y);
      const sortedUniqueYs = [...new Set(rawYs.map(y => Math.round(y / 50) * 50))].sort((a, b) => a - b);

      const rowY = (rawY) => {
        let closest = sortedUniqueYs[0];
        let minDist = Math.abs(rawY - closest);
        for (const sy of sortedUniqueYs) {
          const d = Math.abs(rawY - sy);
          if (d < minDist) { minDist = d; closest = sy; }
        }
        return sortedUniqueYs.indexOf(closest);
      };

      memberNodes.forEach(node => {
        const rowIndex = rowY(node.position().y);
        node.position({ x: node.position().x, y: rowIndex * BAND });
      });

      // ── Step 2: Align spouses to same Y (union-find on real member nodes) ─
      const spouseEdges = cy.edges('[type = "spouse"]').filter(
        e => e.source().data('type') !== 'couple' && e.target().data('type') !== 'couple'
      );
      const uf = {};
      const find = (id) => {
        if (!uf[id] || uf[id] === id) { uf[id] = id; return id; }
        return (uf[id] = find(uf[id]));
      };
      const union = (a, b) => { uf[find(a)] = find(b); };
      spouseEdges.forEach(e => union(e.source().id(), e.target().id()));

      const spouseClusters = new Map();
      memberNodes.forEach(node => {
        const root = find(node.id());
        if (!spouseClusters.has(root)) spouseClusters.set(root, []);
        spouseClusters.get(root).push(node);
      });

      spouseClusters.forEach(nodes => {
        if (nodes.length <= 1) return;
        const minY = Math.min(...nodes.map(n => n.position().y));
        nodes.forEach(n => n.position({ x: n.position().x, y: minY }));
      });

      // ── Step 3: Place each couple node exactly between its two spouses ────
      cy.nodes('[type = "couple"]').forEach(coupleNode => {
        const parents = coupleNode.connectedEdges('[type = "spouse"]')
          .connectedNodes()
          .filter(n => n.id() !== coupleNode.id());

        if (parents.length === 2) {
          const x1 = parents[0].position().x;
          const x2 = parents[1].position().x;
          const y  = parents[0].position().y;
          coupleNode.position({ x: (x1 + x2) / 2, y });
        } else if (parents.length === 1) {
          coupleNode.position({ ...parents[0].position() });
        }
      });

      // ── Step 4: Align half-siblings to their full-sibling row ─────────────
      // A child may only have one parent recorded (half-sibling case). We find
      // ALL children of each parent node and snap them to the same Y so that
      // half-siblings appear on the same row as their full siblings.
      const childYByParent = new Map(); // parentId -> best Y for their children

      // First pass: find the dominant child-row Y for each parent
      // (use the Y of children coming through a couple node as the reference)
      cy.edges('[type = "parent-child"]').forEach(e => {
        const src = e.source();
        const tgt = e.target();
        // Edges from couple nodes define the "official" child row for those parents
        if (src.data('type') === 'couple') {
          const coupleParents = src.connectedEdges('[type = "spouse"]')
            .connectedNodes()
            .filter(n => n.id() !== src.id());
          coupleParents.forEach(p => {
            const childY = tgt.position().y;
            if (!childYByParent.has(p.id()) || childY < childYByParent.get(p.id())) {
              childYByParent.set(p.id(), childY);
            }
          });
        }
      });

      // Second pass: snap direct (non-couple) children to their parent's child row
      cy.edges('[type = "parent-child"]').forEach(e => {
        const src = e.source();
        const tgt = e.target();
        if (src.data('type') !== 'couple' && childYByParent.has(src.id())) {
          const targetY = childYByParent.get(src.id());
          tgt.position({ x: tgt.position().x, y: targetY });
        }
      });

      cy.fit(undefined, 40);
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
    // Couple nodes: tiny filled dot, no label
    {
      selector: 'node[type="couple"]',
      style: {
        "background-color": "#555",
        label: "",
        width: 10,
        height: 10,
        "border-width": 0,
      },
    },
    {
      selector: "edge",
      style: {
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#333",
        "line-color": "#333",
        width: 2,
        "curve-style": "straight",
      },
    },
    {
      selector: 'edge[type="spouse"]',
      style: {
        "target-arrow-shape": "none",
        "line-color": "#E84C9F",
        "line-style": "solid",
        "curve-style": "straight",
        width: 3,
      },
    },
    {
      selector: 'edge[type="parent-child"]',
      style: {
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#333",
        "line-color": "#333",
        "curve-style": "straight",
        width: 2,
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