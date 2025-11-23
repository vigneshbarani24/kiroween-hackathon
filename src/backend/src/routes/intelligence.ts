/**
 * Intelligence API Routes
 * Endpoints for Custom Code Intelligence features
 */

import express from 'express';
import { DocumentationGenerator } from '../../services/documentationGenerator';
import { VectorSearchService } from '../../services/vectorSearch';
import { QAService } from '../../services/qaService';
import { DependencyGraphService } from '../../services/dependencyGraph';
import { RedundancyDetector } from '../../services/redundancyDetector';

const router = express.Router();

// Initialize services
const docGen = new DocumentationGenerator();
const vectorSearch = new VectorSearchService();
const qaService = new QAService(vectorSearch);
const depGraph = new DependencyGraphService();
const redundancyDetector = new RedundancyDetector();

// Initialize Pinecone on startup
vectorSearch.initialize().catch(console.error);

/**
 * POST /api/intelligence/generate-docs
 * Generate documentation from ABAP code
 */
router.post('/generate-docs', async (req, res) => {
  try {
    const { abapCode, analysis } = req.body;
    
    if (!analysis) {
      return res.status(400).json({
        error: 'Missing analysis data. Please provide ABAP analysis.'
      });
    }
    
    console.log(`📝 Generating documentation for: ${analysis.name}`);
    
    // Generate documentation
    const documentation = await docGen.generateDocumentation(analysis);
    
    // Index for search
    const docId = `doc-${Date.now()}-${analysis.name}`;
    await vectorSearch.indexCode(
      docId,
      abapCode || '',
      documentation.markdown,
      {
        name: analysis.name,
        type: analysis.type,
        module: analysis.module
      }
    );
    
    res.json({
      id: docId,
      documentation: documentation.markdown,
      metadata: documentation.metadata,
      generatedAt: documentation.generatedAt
    });
  } catch (error) {
    console.error('Error generating documentation:', error);
    res.status(500).json({
      error: 'Failed to generate documentation',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/generate-docs-batch
 * Generate documentation for multiple ABAP files
 */
router.post('/generate-docs-batch', async (req, res) => {
  try {
    const { analyses } = req.body;
    
    if (!Array.isArray(analyses) || analyses.length === 0) {
      return res.status(400).json({
        error: 'Missing analyses array'
      });
    }
    
    console.log(`📝 Generating documentation for ${analyses.length} files`);
    
    const results = await docGen.generateBatch(analyses);
    
    // Index all for search
    for (let i = 0; i < results.length; i++) {
      const doc = results[i];
      const docId = `doc-${Date.now()}-${i}-${doc.metadata.name}`;
      
      await vectorSearch.indexCode(
        docId,
        '', // ABAP code not needed for indexing
        doc.markdown,
        {
          name: doc.metadata.name,
          type: doc.metadata.type,
          module: doc.metadata.module
        }
      );
    }
    
    res.json({
      count: results.length,
      results: results.map(r => ({
        name: r.metadata.name,
        documentation: r.markdown,
        generatedAt: r.generatedAt
      }))
    });
  } catch (error) {
    console.error('Error generating batch documentation:', error);
    res.status(500).json({
      error: 'Failed to generate batch documentation',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/qa
 * Ask questions about the code
 */
router.post('/qa', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        error: 'Missing question'
      });
    }
    
    console.log(`❓ Question: ${question}`);
    
    const answer = await qaService.answerQuestion(question);
    
    res.json(answer);
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

/**
 * GET /api/intelligence/suggested-questions
 * Get suggested questions
 */
router.get('/suggested-questions', async (req, res) => {
  try {
    const suggestions = await qaService.getSuggestedQuestions();
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/search
 * Semantic search across code
 */
router.post('/search', async (req, res) => {
  try {
    const { query, topK = 5, filter } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing query'
      });
    }
    
    console.log(`🔍 Searching: ${query}`);
    
    const results = filter
      ? await vectorSearch.searchWithFilter(query, filter, topK)
      : await vectorSearch.search(query, topK);
    
    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        name: r.metadata.name,
        type: r.metadata.type,
        module: r.metadata.module,
        relevance: r.score,
        preview: r.metadata.documentation
      }))
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      error: 'Failed to search',
      message: error.message
    });
  }
});

/**
 * GET /api/intelligence/stats
 * Get index statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await vectorSearch.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/generate-summary
 * Generate summary documentation for all code
 */
router.post('/generate-summary', async (req, res) => {
  try {
    const { analyses } = req.body;
    
    if (!Array.isArray(analyses)) {
      return res.status(400).json({
        error: 'Missing analyses array'
      });
    }
    
    console.log(`📊 Generating summary for ${analyses.length} files`);
    
    const summary = await docGen.generateSummary(analyses);
    
    res.json({
      summary,
      count: analyses.length,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error.message
    });
  }
});

export { router as intelligenceRouter };


/**
 * POST /api/intelligence/dependency-graph
 * Build dependency graph from ABAP objects
 */
router.post('/dependency-graph', async (req, res) => {
  try {
    const { objects } = req.body;
    
    if (!Array.isArray(objects)) {
      return res.status(400).json({
        error: 'Missing objects array'
      });
    }
    
    console.log(`📊 Building dependency graph for ${objects.length} objects`);
    
    const graph = depGraph.buildGraph(objects);
    const complexity = depGraph.calculateComplexity(graph);
    const criticalNodes = depGraph.findCriticalNodes(graph, 10);
    
    res.json({
      graph,
      complexity,
      criticalNodes
    });
  } catch (error) {
    console.error('Error building dependency graph:', error);
    res.status(500).json({
      error: 'Failed to build dependency graph',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/impact-analysis
 * Analyze impact of changing an object
 */
router.post('/impact-analysis', async (req, res) => {
  try {
    const { objectName, graph } = req.body;
    
    if (!objectName || !graph) {
      return res.status(400).json({
        error: 'Missing objectName or graph'
      });
    }
    
    console.log(`🎯 Analyzing impact of: ${objectName}`);
    
    const impacted = depGraph.findImpact(objectName, graph);
    const dependencies = depGraph.findDependencies(objectName, graph);
    
    res.json({
      objectName,
      impacted,
      dependencies,
      impactCount: impacted.length,
      dependencyCount: dependencies.length
    });
  } catch (error) {
    console.error('Error analyzing impact:', error);
    res.status(500).json({
      error: 'Failed to analyze impact',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/redundancies
 * Find duplicate and similar code
 */
router.post('/redundancies', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!Array.isArray(files)) {
      return res.status(400).json({
        error: 'Missing files array'
      });
    }
    
    console.log(`🔍 Detecting redundancies in ${files.length} files`);
    
    const redundancies = await redundancyDetector.findRedundancies(files);
    const statistics = redundancyDetector.getStatistics(redundancies);
    const plan = await redundancyDetector.generateConsolidationPlan(redundancies);
    
    res.json({
      redundancies,
      statistics,
      consolidationPlan: plan
    });
  } catch (error) {
    console.error('Error detecting redundancies:', error);
    res.status(500).json({
      error: 'Failed to detect redundancies',
      message: error.message
    });
  }
});

/**
 * POST /api/intelligence/clusters
 * Find clusters of similar files
 */
router.post('/clusters', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!Array.isArray(files)) {
      return res.status(400).json({
        error: 'Missing files array'
      });
    }
    
    console.log(`🔍 Finding clusters in ${files.length} files`);
    
    const clusters = await redundancyDetector.findClusters(files);
    
    res.json({
      clusters,
      count: clusters.length
    });
  } catch (error) {
    console.error('Error finding clusters:', error);
    res.status(500).json({
      error: 'Failed to find clusters',
      message: error.message
    });
  }
});

export { router as intelligenceRouter };
