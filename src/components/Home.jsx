import React from "react";
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">My Family Tree!</h1>
        <p className="home-subtitle">Discover, Connect, and Preserve Your Family Legacy</p>
        
        {/* SVG Family Tree Illustration */}
        <svg className="family-tree-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          {/* Tree Trunk */}
          <rect x="180" y="220" width="40" height="180" fill="#8B4513" />
          
          {/* Tree Foliage (circles) */}
          <circle cx="200" cy="180" r="80" fill="#4CAF50" opacity="0.9" />
          <circle cx="150" cy="150" r="60" fill="#45a049" opacity="0.9" />
          <circle cx="250" cy="150" r="60" fill="#45a049" opacity="0.9" />
          <circle cx="200" cy="100" r="70" fill="#4CAF50" opacity="0.95" />
          
          {/* Family members (people icons as circles with text) */}
          {/* Grandparents */}
          <g className="family-member">
            <circle cx="140" cy="120" r="12" fill="white" stroke="#333" strokeWidth="2" />
            <text x="140" y="125" fontSize="16" textAnchor="middle" fill="#333">👴</text>
          </g>
          <g className="family-member">
            <circle cx="260" cy="120" r="12" fill="white" stroke="#333" strokeWidth="2" />
            <text x="260" y="125" fontSize="16" textAnchor="middle" fill="#333">👵</text>
          </g>
          
          {/* Parents */}
          <g className="family-member">
            <circle cx="170" cy="160" r="12" fill="white" stroke="#333" strokeWidth="2" />
            <text x="170" y="165" fontSize="16" textAnchor="middle" fill="#333">👨</text>
          </g>
          <g className="family-member">
            <circle cx="230" cy="160" r="12" fill="white" stroke="#333" strokeWidth="2" />
            <text x="230" y="165" fontSize="16" textAnchor="middle" fill="#333">👩</text>
          </g>
          
          {/* Children */}
          <g className="family-member">
            <circle cx="180" cy="200" r="10" fill="white" stroke="#333" strokeWidth="2" />
            <text x="180" y="204" fontSize="14" textAnchor="middle" fill="#333">👦</text>
          </g>
          <g className="family-member">
            <circle cx="200" cy="210" r="10" fill="white" stroke="#333" strokeWidth="2" />
            <text x="200" y="214" fontSize="14" textAnchor="middle" fill="#333">👧</text>
          </g>
          <g className="family-member">
            <circle cx="220" cy="200" r="10" fill="white" stroke="#333" strokeWidth="2" />
            <text x="220" y="204" fontSize="14" textAnchor="middle" fill="#333">👶</text>
          </g>
          
          {/* Connecting lines */}
          <line x1="140" y1="132" x2="170" y2="148" stroke="#666" strokeWidth="2" opacity="0.5" />
          <line x1="260" y1="132" x2="230" y2="148" stroke="#666" strokeWidth="2" opacity="0.5" />
          <line x1="170" y1="172" x2="180" y2="190" stroke="#666" strokeWidth="2" opacity="0.5" />
          <line x1="230" y1="172" x2="220" y2="190" stroke="#666" strokeWidth="2" opacity="0.5" />
        </svg>
        
        <div className="home-features">
          <div className="feature-card">
            <span className="feature-icon">👨‍👩‍👧‍👦</span>
            <h3>Build Our Tree</h3>
            <p>Add family members and track relationships</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔗</span>
            <h3>Connect Generations</h3>
            <p>Link parents, children, and relatives</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Visualize History</h3>
            <p>See Our family history come to life</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;