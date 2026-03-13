'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import { getGovernanceMapData, type GovernanceMapData } from '@/lib/api'

// Force Graph 3D must be imported dynamically for Next.js SSR
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false })

export default function GovernanceMapPage() {
  const [graphData, setGraphData] = useState<GovernanceMapData | null>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const nodeColors: Record<string, string> = {
    promise: '#3b82f6', // blue-500
    policy: '#a855f7', // purple-500
    budget: '#22c55e', // green-500
    program: '#f97316', // orange-500
  }

  const legendItems = [
    { label: 'Promise', color: 'bg-blue-500' },
    { label: 'Policy', color: 'bg-purple-500' },
    { label: 'Budget', color: 'bg-green-500' },
    { label: 'Program', color: 'bg-orange-500' },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50 overflow-hidden relative">
      {/* --- Header --- */}
      <div className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Governance Intelligence Map</h1>
            <p className="text-slate-400 max-w-2xl">
              Explore the 3D interconnected network of manifesto promises, legislative policies, budgetary allocations, and implementation programs.
            </p>
          </div>
          <div className="flex gap-2">
            {legendItems.map((item) => (
              <Badge key={item.label} variant="outline" className="bg-slate-900 border-slate-700 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${item.color} mr-2`} />
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Viz Area --- */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-slate-400 font-medium">Initializing Neural Governance Graph...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
             {graphData && (
              <ForceGraph3D
                graphData={graphData}
                backgroundColor="#020617"
                nodeLabel={(node: any) => `<div class="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl"><b class="text-blue-400">${node.type.toUpperCase()}</b><br/>${node.name}</div>`}
                nodeColor={(node: any) => nodeColors[node.type] || '#ffffff'}
                nodeRelSize={6}
                nodeOpacity={0.9}
                linkWidth={1}
                linkColor={() => '#475569'}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={1.5}
                onNodeClick={(node: any) => setSelectedNode(node)}
                cooldownTicks={100}
              />
             )}
          </div>
        )}

        {/* --- Side Panel --- */}
        {selectedNode && (
          <div className="absolute top-8 right-8 w-96 animate-in slide-in-from-right duration-300 z-30">
            <Card className="bg-slate-900/90 border-slate-700 text-slate-50 shadow-2xl backdrop-blur-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <Badge className={`mb-2 ${
                    selectedNode.type === 'promise' ? 'bg-blue-600' :
                    selectedNode.type === 'policy' ? 'bg-purple-600' :
                    selectedNode.type === 'budget' ? 'bg-green-600' : 'bg-orange-600'
                  }`}>
                    {selectedNode.type.toUpperCase()}
                  </Badge>
                  <CardTitle className="text-xl font-bold leading-tight">{selectedNode.name}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intelligence Detail</label>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedNode.details || "Linking data for this node is being processed by the intelligence engine."}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50 border-slate-600">
                    <Info className="mr-2 h-4 w-4" />
                    Deep Dive Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- Bottom Controls Overlay --- */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-10">
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl flex flex-col gap-1 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-50"><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-50"><ZoomOut className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-50" onClick={() => window.location.reload()}><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">USE MOUSE TO ROTATE / SCROLL TO ZOOM</p>
        </div>
      </div>
    </div>
  )
}
