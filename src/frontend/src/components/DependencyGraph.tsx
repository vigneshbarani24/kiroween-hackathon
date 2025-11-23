/**
 * Dependency Graph Component
 * Interactive D3.js visualization of code dependencies
 */

import React, { useEffect, useRef } from 'react';

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    module: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

interface Props {
  data: GraphData;
  width?: number;
  height?: number;
}

export function DependencyGraph({ data, width = 800, height = 600 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    // This is a placeholder for D3.js implementation
    // In a real implementation, you would use d3-force for the layout
    
    const svg = svgRef.current;
    svg.innerHTML = ''; // Clear previous
    
    // Simple visualization without D3 dependency
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Draw links
    data.links.forEach((link, i) => {
      const sourceNode = data.nodes.find(n => n.id === link.source);
      const targetNode = data.nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        const sourceIndex = data.nodes.indexOf(sourceNode);
        const targetIndex = data.nodes.indexOf(targetNode);
        
        const sourceAngle = (sourceIndex / data.nodes.length) * 2 * Math.PI;
        const targetAngle = (targetIndex / data.nodes.length) * 2 * Math.PI;
        
        const x1 = centerX + radius * Math.cos(sourceAngle);
        const y1 = centerY + radius * Math.sin(sourceAngle);
        const x2 = centerX + radius * Math.cos(targetAngle);
        const y2 = centerY + radius * Math.sin(targetAngle);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1.toString());
        line.setAttribute('y1', y1.toString());
        line.setAttribute('x2', x2.toString());
        line.setAttribute('y2', y2.toString());
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-opacity', '0.6');
        svg.appendChild(line);
      }
    });
    
    // Draw nodes
    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', getColorByType(node.type));
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';
      
      circle.addEventListener('click', () => {
        setSelectedNode(node.id);
      });
      
      svg.appendChild(circle);
      
      // Add label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (y - 12).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#333');
      text.textContent = node.name.substring(0, 15);
      svg.appendChild(text);
    });
    
  }, [data, width, height]);
  
  function getColorByType(type: string): string {
    const colors: Record<string, string> = {
      'FUNCTION': '#4CAF50',
      'REPORT': '#2196F3',
      'CLASS': '#FF9800',
      'INCLUDE': '#9C27B0',
      'PROGRAM': '#F44336'
    };
    return colors[type] || '#757575';
  }
  
  return (
    <div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          background: '#fafafa'
        }}
      />
      
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <LegendItem color="#4CAF50" label="Function" />
        <LegendItem color="#2196F3" label="Report" />
        <LegendItem color="#FF9800" label="Class" />
        <LegendItem color="#9C27B0" label="Include" />
        <LegendItem color="#F44336" label="Program" />
      </div>
      
      {selectedNode && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e3f2fd',
          border: '1px solid #2196F3',
          borderRadius: '8px'
        }}>
          <strong>Selected:</strong> {selectedNode}
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              marginLeft: '10px',
              padding: '4px 12px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>
      )}
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f9f9f9',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>💡 Tip:</strong> Click on nodes to see details. 
        In a full implementation, this would use D3.js force-directed layout for better visualization.
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: color
      }} />
      <span style={{ fontSize: '14px', color: '#666' }}>{label}</span>
    </div>
  );
}
