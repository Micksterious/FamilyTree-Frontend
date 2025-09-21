import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Tree from "react-d3-tree";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import { API_URL } from "../shared";

function FamilyTree() {
  const [treeData, setTreeData] = useState(null);
  const treeContainer = useRef(null);
  const navigate = useNavigate(); // redirect if token fails

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await axios.get(`${API_URL}/auth/me`, {
          withCredentials: true,
        });
        if (!me.data?.user) return navigate("/login");

        const memberRes = await axios.get(`${API_URL}/api/familymembers`, {
          withCredentials: true,
        });
        const relRes = await axios.get(`${API_URL}/api/relationships`, {
          withCredentials: true,
        });

        const members = memberRes.data;
        const relationships = relRes.data;

        const memberMap = {};
        members.forEach((m) => {
          memberMap[m.id] = {
            name: `${m.firstname} ${m.lastname}`,
            attributes: {
              DOB: new Date(m.date_of_birth).toLocaleDateString(),
              Sex: m.sex,
            },
            children: [],
          };
        });

        const added = new Set(); // track who’s already been added as a child

        relationships.forEach((rel) => {
          const parent = memberMap[rel.parent_id];
          const child = memberMap[rel.child_id];

          if (parent && child) {
            // Only add child if it hasn't already been added under another parent
            if (!added.has(child.id)) {
              parent.children.push(child);
              added.add(child.id);
            }
          }
        });

        const childIds = new Set(relationships.map((r) => r.child_id));
        const roots = members
          .filter((m) => !childIds.has(m.id))
          .map((m) => memberMap[m.id]);

        const treeRoot =
          roots.length === 1
            ? roots[0]
            : {
                name: "Family Root",
                children: roots,
              };

        setTreeData(treeRoot);
      } catch (err) {
        console.error("Auth error or fetch error:", err);
        navigate("/login"); // redirect if unauthorized
      }
    };

    fetchData();
  }, [navigate]);

  const renderCustomNode = ({ nodeDatum }) => (
    <g>
      <circle r={10} fill="green" />
      <text fill="black" x={15}>
        {nodeDatum.name}
      </text>
      {nodeDatum.attributes?.DOB && (
        <text fill="gray" x={15} dy="1.2em">
          DOB: {nodeDatum.attributes.DOB}
        </text>
      )}
      {nodeDatum.attributes?.Sex && (
        <text fill="gray" x={15} dy="2.4em">
          Sex: {nodeDatum.attributes.Sex}
        </text>
      )}
    </g>
  );

  return (
    <>
      <div
        style={{ width: "100%", height: "calc(100vh - 50px)" }}
        ref={treeContainer}
      >
        {treeData && (
          <Tree
            data={treeData}
            orientation="vertical"
            pathFunc="elbow"
            translate={{ x: 500, y: 100 }}
            renderCustomNodeElement={renderCustomNode}
            collapsible={false}
          />
        )}
      </div>
    </>
  );
}

export default FamilyTree;
