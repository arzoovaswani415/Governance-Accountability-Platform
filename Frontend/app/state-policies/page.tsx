'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Map, Activity, Filter } from 'lucide-react'
import StatePolicyDetails from '@/components/state-policy-details'

interface StatePolicy {
  id: number
  policy_name: string
  state_name: string
  sector: string
  description: string
  launch_year: number
  status: string
  source_url: string
}

export default function StatePoliciesPage() {
  const [policies, setPolicies] = useState<StatePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null)

  useEffect(() => {
    fetchPolicies()
  }, [selectedState, selectedSector])

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (selectedState) queryParams.append('state', selectedState)
      if (selectedSector) queryParams.append('sector', selectedSector)
      
      const res = await fetch(`http://localhost:8000/api/state-policies?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPolicies(data)
      }
    } catch (error) {
      console.error('Failed to fetch state policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const states = Array.from(new Set(policies.map(p => p.state_name))).sort()
  const sectors = Array.from(new Set(policies.map(p => p.sector))).sort()

  const filteredPolicies = policies.filter(p => 
    p.policy_name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Map className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">State Policy Explorer</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Explore and compare major policies from Indian states
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                title="State"
                className="flex h-10 w-full sm:w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select 
                title="Sector"
                className="flex h-10 w-full sm:w-[150px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main View: Policy Cards */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent" />
            </div>
          ) : filteredPolicies.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPolicies.map(policy => (
                <Card 
                  key={policy.id} 
                  className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden ${selectedPolicyId === policy.id ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedPolicyId(policy.id)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl leading-tight line-clamp-2">
                        {policy.policy_name}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-primary/5 text-primary whitespace-nowrap">
                        {policy.launch_year || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{policy.state_name}</Badge>
                      <Badge variant="outline" className="text-muted-foreground">{policy.sector}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {policy.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No state policies found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Side Panel: Policy Detail View */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedPolicyId ? (
              <StatePolicyDetails policyId={selectedPolicyId} />
            ) : (
               <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed text-muted-foreground">
                 <Map className="w-12 h-12 mb-4 text-muted-foreground/30" />
                 <h3 className="font-semibold text-foreground mb-1">Select a Policy</h3>
                 <p className="text-sm">Click on any state policy card to view detailed implementation mapping and similarities to national programs.</p>
               </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
