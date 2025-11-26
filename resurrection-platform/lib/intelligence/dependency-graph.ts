/**
 * Dependency Graph Service
 * Builds and analyzes dependency graphs from ABAP code
 * 
 * Features:
 * - Extract dependencies from ABAP analysis
 * - Build graph data structure
 * - Calculate impact analysis
 * - Find circular dependencies
 */

interface ABAPObject {
  name: string;
  type: string;
  module: string;
  dependencies: Array<{
    name: string;
    type: string;
  }>;
  linesOfCode?: number;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  module: string;
  linesOfCode: number;
  dependencyCount: number;
  dependentCount: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface DependencyGraph {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    totalNodes: number;
    totalLinks: number;
    circularDependencies: string[][];
    mostDependent: GraphNode[];
    mostDependencies: GraphNode[];
  };
}

export class DependencyGraphService {
  /**
   * Build dependency graph from ABAP objects
   */
  buildGraph(objects: ABAPObject[]): DependencyGraph {
    // Build nodes
    const nodes: GraphNode[] = objects.map(obj => ({
      id: obj.name,
      name: obj.name,
      type: obj.type,
      module: obj.module,
      linesOfCode: obj.linesOfCode || 0,
      dependencyCount: obj.dependencies.length,
      dependentCount: 0 // Will calculate below
    }));
    
    // Build links
    const links: GraphLink[] = [];
    objects.forEach(obj => {
      obj.dependencies.forEach(dep => {
        links.push({
          source: obj.name,
          target: dep.name,
          type: dep.type || 'calls'
        });
      });
    });
    
    // Calculate dependent counts
    const dependentCounts = new Map<string, number>();
    links.forEach(link => {
      dependentCounts.set(
        link.target,
        (dependentCounts.get(link.target) || 0) + 1
      );
    });
    
    nodes.forEach(node => {
      node.dependentCount = dependentCounts.get(node.id) || 0;
    });
    
    // Find circular dependencies
    const circularDeps = this.findCircularDependencies(nodes, links);
    
    // Find most dependent/dependencies
    const mostDependent = [...nodes]
      .sort((a, b) => b.dependentCount - a.dependentCount)
      .slice(0, 5);
    
    const mostDependencies = [...nodes]
      .sort((a, b) => b.dependencyCount - a.dependencyCount)
      .slice(0, 5);
    
    return {
      nodes,
      links,
      stats: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        circularDependencies: circularDeps,
        mostDependent,
        mostDependencies
      }
    };
  }
  
  /**
   * Find all objects that depend on a given object (impact analysis)
   */
  findImpact(objectName: string, graph: DependencyGraph): string[] {
    const impacted = new Set<string>();
    const visited = new Set<string>();
    
    const traverse = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      
      // Find all objects that depend on this one
      graph.links
        .filter(link => link.target === name)
        .forEach(link => {
          if (!impacted.has(link.source)) {
            impacted.add(link.source);
            traverse(link.source); // Recursive traversal
          }
        });
    };
    
    traverse(objectName);
    return Array.from(impacted);
  }
  
  /**
   * Find all dependencies of a given object (what it depends on)
   */
  findDependencies(objectName: string, graph: DependencyGraph): string[] {
    const dependencies = new Set<string>();
    const visited = new Set<string>();
    
    const traverse = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      
      // Find all objects this one depends on
      graph.links
        .filter(link => link.source === name)
        .forEach(link => {
          if (!dependencies.has(link.target)) {
            dependencies.add(link.target);
            traverse(link.target); // Recursive traversal
          }
        });
    };
    
    traverse(objectName);
    return Array.from(dependencies);
  }
  
  /**
   * Find circular dependencies using DFS
   */
  private findCircularDependencies(
    nodes: GraphNode[],
    links: GraphLink[]
  ): string[][] {
    const circles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    links.forEach(link => {
      if (!adjacency.has(link.source)) {
        adjacency.set(link.source, []);
      }
      adjacency.get(link.source)!.push(link.target);
    });
    
    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          circles.push([...cycle, neighbor]);
          return true;
        }
      }
      
      recursionStack.delete(node);
      path.pop();
      return false;
    };
    
    // Check each node
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });
    
    return circles;
  }
  
  /**
   * Get subgraph for a specific module
   */
  getModuleSubgraph(module: string, graph: DependencyGraph): DependencyGraph {
    const moduleNodes = graph.nodes.filter(n => n.module === module);
    const moduleNodeIds = new Set(moduleNodes.map(n => n.id));
    
    const moduleLinks = graph.links.filter(
      link => moduleNodeIds.has(link.source) && moduleNodeIds.has(link.target)
    );
    
    return {
      nodes: moduleNodes,
      links: moduleLinks,
      stats: {
        totalNodes: moduleNodes.length,
        totalLinks: moduleLinks.length,
        circularDependencies: [],
        mostDependent: [],
        mostDependencies: []
      }
    };
  }
  
  /**
   * Calculate complexity metrics
   */
  calculateComplexity(graph: DependencyGraph): {
    averageDependencies: number;
    maxDependencies: number;
    averageDependents: number;
    maxDependents: number;
    coupling: number;
  } {
    const avgDeps = graph.nodes.reduce((sum, n) => sum + n.dependencyCount, 0) / graph.nodes.length;
    const maxDeps = Math.max(...graph.nodes.map(n => n.dependencyCount));
    const avgDependents = graph.nodes.reduce((sum, n) => sum + n.dependentCount, 0) / graph.nodes.length;
    const maxDependents = Math.max(...graph.nodes.map(n => n.dependentCount));
    
    // Coupling: ratio of actual links to possible links
    const possibleLinks = graph.nodes.length * (graph.nodes.length - 1);
    const coupling = possibleLinks > 0 ? graph.links.length / possibleLinks : 0;
    
    return {
      averageDependencies: avgDeps,
      maxDependencies: maxDeps,
      averageDependents: avgDependents,
      maxDependents: maxDependents,
      coupling
    };
  }
  
  /**
   * Find critical nodes (high impact if changed)
   */
  findCriticalNodes(graph: DependencyGraph, topN: number = 10): GraphNode[] {
    // Critical = high dependent count + high dependency count
    return [...graph.nodes]
      .map(node => ({
        ...node,
        criticalityScore: node.dependentCount * 2 + node.dependencyCount
      }))
      .sort((a, b) => b.criticalityScore - a.criticalityScore)
      .slice(0, topN);
  }
  
  /**
   * Export graph to various formats
   */
  exportGraph(graph: DependencyGraph, format: 'json' | 'dot' | 'cytoscape'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(graph, null, 2);
      
      case 'dot':
        return this.toDotFormat(graph);
      
      case 'cytoscape':
        return this.toCytoscapeFormat(graph);
      
      default:
        return JSON.stringify(graph, null, 2);
    }
  }
  
  private toDotFormat(graph: DependencyGraph): string {
    let dot = 'digraph dependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';
    
    graph.nodes.forEach(node => {
      dot += `  "${node.id}" [label="${node.name}\\n(${node.type})"];\n`;
    });
    
    dot += '\n';
    
    graph.links.forEach(link => {
      dot += `  "${link.source}" -> "${link.target}";\n`;
    });
    
    dot += '}\n';
    return dot;
  }
  
  private toCytoscapeFormat(graph: DependencyGraph): string {
    const cytoscape = {
      elements: {
        nodes: graph.nodes.map(n => ({
          data: {
            id: n.id,
            label: n.name,
            type: n.type,
            module: n.module
          }
        })),
        edges: graph.links.map((l, i) => ({
          data: {
            id: `e${i}`,
            source: l.source,
            target: l.target,
            type: l.type
          }
        }))
      }
    };
    
    return JSON.stringify(cytoscape, null, 2);
  }
}
