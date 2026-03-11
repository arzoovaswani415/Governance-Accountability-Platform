'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCcw, Network, FileText, Wallet, Target, Lightbulb } from 'lucide-react'

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-black/90 rounded-xl">
      <div className="text-white/60 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        <span>Loading visualization...</span>
      </div>
    </div>
  ),
})

// Node type definitions
interface GraphNode {
  id: string
  name: string
  type: 'promise' | 'policy' | 'budget' | 'program'
  description?: string
  year?: number
  status?: string
  sector?: string
  amount?: string
}

interface GraphLink {
  source: string
  target: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

import { getGovernanceMapData } from '@/lib/api'

// Node color mapping
const nodeColors: Record<string, string> = {
  promise: '#3b82f6',  // blue
  policy: '#8b5cf6',   // purple
  budget: '#22c55e',   // green
  program: '#f97316',  // orange
}

const nodeLabels: Record<string, string> = {
  promise: 'Promise',
  policy: 'Policy',
  budget: 'Budget',
  program: 'Program',
}

const nodeIcons: Record<string, typeof Lightbulb> = {
  promise: Lightbulb,
  policy: FileText,
  budget: Wallet,
  program: Target,
}

export default function GovernanceMapPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const fgRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGovernanceMapData()
        setGraphData(data as unknown as GraphData)
      } catch (error) {
        console.error("Failed to load map data:", error)
      }
    }
    loadData()
  }, [])

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    // Focus on node
    if (fgRef.current) {
      const distance = 200
      const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0)
      fgRef.current.cameraPosition(
        { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
        node,
        1000
      )
    }
  }, [])

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node)
  }, [])

  const resetCamera = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000)
    }
  }, [])

  const zoomIn = useCallback(() => {
    if (fgRef.current) {
      const currentPos = fgRef.current.cameraPosition()
      fgRef.current.cameraPosition(
        { x: currentPos.x * 0.7, y: currentPos.y * 0.7, z: currentPos.z * 0.7 },
        null,
        500
      )
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (fgRef.current) {
      const currentPos = fgRef.current.cameraPosition()
      fgRef.current.cameraPosition(
        { x: currentPos.x * 1.4, y: currentPos.y * 1.4, z: currentPos.z * 1.4 },
        null,
        500
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Governance Intelligence Map
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Explore relationships between promises, policies, budgets, and implementation programs. 
            Click on nodes to view details, drag to rotate, and scroll to zoom.
          </p>
        </div>

        {/* Legend */}
        <Card className="p-4 mb-6 border border-border">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Legend:</span>
            {Object.entries(nodeColors).map(([type, color]) => {
              const Icon = nodeIcons[type]
              return (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}60` }}
                  />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{nodeLabels[type]}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualization Container */}
          <div className="lg:col-span-2">
            <Card className="relative overflow-hidden border border-border bg-black rounded-xl shadow-lg">
              {/* Controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={zoomIn}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={zoomOut}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={resetCamera}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Hover Tooltip */}
              {hoveredNode && !selectedNode && (
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <Card className="p-3 bg-black/80 border-white/20 text-white backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: nodeColors[hoveredNode.type] }}
                      />
                      <span className="text-xs uppercase tracking-wide text-white/60">
                        {nodeLabels[hoveredNode.type]}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{hoveredNode.name}</p>
                  </Card>
                </div>
              )}

              {/* Graph Container */}
              <div ref={containerRef} className="h-[600px] w-full">
                {graphData ? (
                  <ForceGraph3D
                    ref={fgRef}
                    graphData={graphData}
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor="#000000"
                    nodeLabel={(node: GraphNode) => `${nodeLabels[node.type]}: ${node.name}`}
                    nodeColor={(node: GraphNode) => nodeColors[node.type]}
                    nodeRelSize={8}
                    nodeOpacity={0.9}
                    linkColor={() => 'rgba(255, 255, 255, 0.2)'}
                    linkWidth={2}
                    linkOpacity={0.6}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleColor={() => 'rgba(255, 255, 255, 0.8)'}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    cooldownTicks={100}
                    enableNodeDrag={true}
                    enableNavigationControls={true}
                    showNavInfo={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50">
                    Loading graph data...
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border sticky top-24 min-h-[600px]">
              {selectedNode ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-lg shrink-0"
                        style={{ 
                          backgroundColor: nodeColors[selectedNode.type],
                          boxShadow: `0 0 12px ${nodeColors[selectedNode.type]}80`
                        }}
                      />
                      <Badge 
                        className="text-xs font-medium"
                        style={{ 
                          backgroundColor: `${nodeColors[selectedNode.type]}20`,
                          color: nodeColors[selectedNode.type],
                          borderColor: `${nodeColors[selectedNode.type]}40`
                        }}
                      >
                        {nodeLabels[selectedNode.type]}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedNode(null)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold text-foreground leading-tight">
                    {selectedNode.name}
                  </h2>

                  {/* Details */}
                  <div className="space-y-4">
                    {selectedNode.description && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                        <p className="text-sm text-foreground leading-relaxed">
                          {selectedNode.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {selectedNode.year && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Year</h3>
                          <p className="text-sm font-medium text-foreground">{selectedNode.year}</p>
                        </div>
                      )}
                      {selectedNode.status && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                          <Badge variant="outline" className="text-xs">
                            {selectedNode.status}
                          </Badge>
                        </div>
                      )}
                      {selectedNode.sector && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Sector</h3>
                          <p className="text-sm font-medium text-foreground">{selectedNode.sector}</p>
                        </div>
                      )}
                      {selectedNode.amount && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                          <p className="text-sm font-medium text-foreground">{selectedNode.amount}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Related Nodes */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Connected Nodes</h3>
                    <div className="space-y-2">
                      {graphData && graphData.links
                        .filter((link: any) => 
                          (link.source.id || link.source) === selectedNode.id || 
                          (link.target.id || link.target) === selectedNode.id
                        )
                        .map((link: any, idx) => {
                          const srcId = typeof link.source === 'object' ? link.source.id : link.source;
                          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
                          const connectedId = srcId === selectedNode.id ? tgtId : srcId;
                          const connectedNode = graphData.nodes.find(n => n.id === connectedId)
                          if (!connectedNode) return null
                          return (
                            <button
                              key={idx}
                              onClick={() => handleNodeClick(connectedNode)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                            >
                              <div 
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: nodeColors[connectedNode.type] }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {connectedNode.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {nodeLabels[connectedNode.type]}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Network className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Node
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Click on any node in the graph to view detailed information about promises, policies, budgets, or programs.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
