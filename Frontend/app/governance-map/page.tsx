'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCcw, Info, Network } from 'lucide-react'
import { getGovernanceMapData, type GovernanceMapData } from '@/lib/api'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

const NODE_COLORS: Record<string, string> = {
  promise: '#3b82f6',
  policy: '#a855f7',
  budget: '#22c55e',
  program: '#f97316',
}

const NODE_SIZES: Record<string, number> = {
  promise: 5,
  policy: 7,
  budget: 6,
  program: 4,
}

export default function GovernanceMapPage() {
  const [graphData, setGraphData] = useState<GovernanceMapData | null>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const graphRef = useRef<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGovernanceMapData()
        setGraphData(data)
      } catch (error) {
        console.error('Failed to load graph data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500)
      graphRef.current.zoom(3, 500)
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.centerAt(0, 0, 500)
      graphRef.current.zoom(1, 500)
    }
  }, [])

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const type = node.type || 'promise'
    const color = NODE_COLORS[type] || '#ffffff'
    const size = NODE_SIZES[type] || 5
    const isSelected = selectedNode?.id === node.id
    const fontSize = Math.max(10 / globalScale, 1.5)

    // Glow effect for selected
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI)
      ctx.fillStyle = color + '30'
      ctx.fill()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#ffffff' : color + '60'
    ctx.lineWidth = isSelected ? 2 : 0.5
    ctx.stroke()

    // Label only when zoomed in enough
    if (globalScale > 1.5) {
      const label = (node.name || '').substring(0, 25)
      ctx.font = `${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(label, node.x, node.y + size + 2)
    }
  }, [selectedNode])

  const legendItems = [
    { label: 'Manifesto Promise', color: 'bg-blue-500', count: graphData?.nodes.filter(n => n.type === 'promise').length || 0 },
    { label: 'Legislative Policy', color: 'bg-purple-500', count: graphData?.nodes.filter(n => n.type === 'policy').length || 0 },
    { label: 'Budget Allocation', color: 'bg-green-500', count: graphData?.nodes.filter(n => n.type === 'budget').length || 0 },
    { label: 'Implementation', color: 'bg-orange-500', count: graphData?.nodes.filter(n => n.type === 'program').length || 0 },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-slate-50 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/50 bg-slate-900/70 backdrop-blur z-10 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Network className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Governance Intelligence Map</h1>
              <p className="text-xs text-slate-400">
                {graphData ? `${graphData.nodes.length} nodes · ${graphData.links.length} connections` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {legendItems.map((item) => (
              <Badge key={item.label} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 text-[10px] px-2 py-0.5">
                <span className={`w-2 h-2 rounded-full ${item.color} mr-1.5 inline-block`} />
                {item.label} ({item.count})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-medium">Constructing governance network...</p>
            </div>
          </div>
        ) : graphData ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            backgroundColor="#020617"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              const size = NODE_SIZES[node.type] || 5
              ctx.beginPath()
              ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI)
              ctx.fillStyle = color
              ctx.fill()
            }}
            linkColor={() => '#334155'}
            linkWidth={0.5}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.003}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={() => '#6366f1'}
            onNodeClick={handleNodeClick}
            cooldownTicks={80}
            d3AlphaDecay={0.04}
            d3VelocityDecay={0.3}
            warmupTicks={30}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-500">Failed to load graph data.</p>
          </div>
        )}

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 z-30">
            <Card className="bg-slate-900/95 border-slate-700 text-slate-50 shadow-2xl backdrop-blur-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-3">
                <div className="flex-1 min-w-0">
                  <Badge className={`mb-2 text-[9px] font-black uppercase tracking-wider ${
                    selectedNode.type === 'promise' ? 'bg-blue-600' :
                    selectedNode.type === 'policy' ? 'bg-purple-600' :
                    selectedNode.type === 'budget' ? 'bg-green-600' : 'bg-orange-600'
                  }`}>
                    {selectedNode.type}
                  </Badge>
                  <CardTitle className="text-sm font-bold leading-snug">{selectedNode.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white h-7 w-7 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedNode.details || "Intelligence data is being compiled for this governance entity."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl flex flex-col gap-0.5 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300)}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300)}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white"
              onClick={handleResetView}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[9px] text-slate-500 font-medium tracking-wider uppercase">Drag to pan · Scroll to zoom</p>
        </div>
      </div>
    </div>
  )
}
