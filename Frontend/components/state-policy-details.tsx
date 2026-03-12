import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownRight, ArrowRight, FileText, Link as LinkIcon, Building2 } from 'lucide-react'

interface PolicyDetailsProps {
  policyId: number
}

interface MappingData {
  state_policy: string
  state: string
  similar_national_policies: {
    policy_name: string
    similarity_score: number
  }[]
}

interface PolicyData {
  id: number
  policy_name: string
  state_name: string
  sector: string
  description: string
  launch_year: number
  status: string
  source_url: string
}

export default function StatePolicyDetails({ policyId }: PolicyDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<PolicyData | null>(null)
  const [mapping, setMapping] = useState<MappingData | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [detailsRes, mappingRes] = await Promise.all([
          fetch(`http://localhost:8000/api/state-policies`),
          fetch(`http://localhost:8000/api/state-policies/${policyId}/mapping`)
        ])
        if (detailsRes.ok && mappingRes.ok) {
          const allPolicies = await detailsRes.json()
          const current = allPolicies.find((p: any) => p.id === policyId)
          if (current) setDetails(current)
            
          const mappingData = await mappingRes.json()
          setMapping(mappingData)
        }
      } catch (err) {
        console.error('Failed to fetch details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [policyId])

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Card>
    )
  }

  if (!details) return null

  return (
    <Card className="shadow-lg border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex gap-2 mb-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            {details.sector}
          </Badge>
          {details.launch_year && (
            <Badge variant="outline" className="text-muted-foreground">
              {details.launch_year}
            </Badge>
          )}
        </div>
        <CardTitle className="leading-tight text-2xl text-foreground">
          {details.policy_name}
        </CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground mt-2">
          <Building2 className="w-4 h-4" />
          <span className="text-sm font-medium">{details.state_name} State Program</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-foreground mb-2">
            <FileText className="w-4 h-4 text-primary" />
            Description
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-lg border border-border">
            {details.description}
          </p>
        </div>

        {details.source_url && (
          <div>
            <a 
              href={details.source_url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              View Official Source
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="flex items-center gap-2 font-semibold text-foreground mb-4">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">AI</span>
            Semantic Mapping to National Policies
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="px-3 py-1.5 shadow-sm border-blue-200 bg-blue-50/50">
                {details.state_name}
              </Badge>
              <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground/50" />
              <Badge variant="outline" className="px-3 py-1.5 shadow-sm border-indigo-200 bg-indigo-50/50">
                Union Govt
              </Badge>
            </div>

            {mapping?.similar_national_policies && mapping.similar_national_policies.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-primary/20 before:to-transparent ml-2 p-2">
                {mapping.similar_national_policies.map((n, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="relative z-10 w-6 h-6 rounded-full bg-background border-2 border-primary/40 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0 bg-background border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground leading-tight">{n.policy_name}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${n.similarity_score > 0.7 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {(n.similarity_score * 100).toFixed(0)}% Match
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full opacity-80 ${n.similarity_score > 0.7 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${n.similarity_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center bg-muted/40 p-6 rounded-lg border border-dashed border-border">
                No deeply similar national policies identified by AI embeddings.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
