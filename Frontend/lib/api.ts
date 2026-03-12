// Central API client for the FairFlow Governance Platform
//
// Configure backend base via env:
// - NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api"
// - NEXT_PUBLIC_API_BASE_URL="https://<ngrok-subdomain>.ngrok-free.dev/api"
const API_BASE = 
  typeof window !== 'undefined'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000/api'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PromiseBrief {
  id: number
  text: string
  status: string
  fulfillment_score: number
  sector: SectorOut
  election_cycle: ElectionCycleOut
}

// Backend returns a richer object for detail endpoints (not strictly typed here yet)
export type PromiseDetail = any

export interface ElectionCycleOut {
  id: number
  name: string
  start_year: number
  end_year: number
}

export interface SectorOut {
  id: number
  name: string
  description?: string | null
}

export interface PolicyBrief {
  id: number
  name: string
  status: string
  sector: SectorOut
  year_introduced: number
}

// Backend returns a richer object for detail endpoints (not strictly typed here yet)
export type PolicyDetail = any

export interface TimelineEvent {
  id: number
  event_type: string
  description: string
  year: number
  policy_id: number | null
  policy_name?: string | null
}

export interface BudgetTrend {
  sector: string
  yearly_data: { year: number; amount_crores: number }[]
}

export interface BudgetPromiseAlignment {
  sector: string
  promise_count: number
  avg_funding_crores: number
  budget_growth_percent: number
  alignment: 'strong' | 'moderate' | 'weak' | 'no_promises'
}

export interface DashboardSummary {
  total_promises: number
  fulfilled: number
  in_progress: number
  partial: number
  no_progress: number
  total_policies: number
  total_bills: number
  sector_distribution: { sector: string; promise_count: number }[]
}

export interface RecentActivity {
  year: number
  policy_name: string
  event_type: string
  description?: string | null
}

export interface SectorPerformanceRow {
  sector: string
  total_promises: number
  fulfilled_promises: number
  total_policies: number
}

export interface GovernanceMapData {
  nodes: {
    id: string
    name: string
    type: 'promise' | 'policy' | 'sector' | 'budget' | 'state_policy'
    val?: number
    color?: string
  }[]
  links: {
    source: string
    target: string
    label?: string
  }[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string, 
  params?: Record<string, string | number | undefined>,
  options?: RequestInit
): Promise<T> {
  let url: URL;
  try {
    let base = API_BASE;
    if (path.startsWith('/api') && base.endsWith('/api')) {
      base = base.slice(0, -4);
    }
    const fullPath = `${base}${path}`.replace(/\/\//g, '/').replace(':/', '://');
    url = new URL(fullPath, typeof window !== 'undefined' ? window.location.origin : undefined);
  } catch (e) {
    let base = API_BASE;
    if (path.startsWith('/api') && base.endsWith('/api')) {
      base = base.slice(0, -4);
    }
    url = new URL(`${base}${path}`, 'http://localhost:3000');
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    })
  }
  const res = await fetch(url.toString(), {
    ...options,
    headers: { 
      'ngrok-skip-browser-warning': 'true',
      ...(options?.headers || {})
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ─── PROMISES ─────────────────────────────────────────────────────────────────

export async function getPromises(filters?: {
  sector?: string
  status?: string
  election_cycle?: string
  search?: string
  skip?: number
  limit?: number
}): Promise<PromiseBrief[]> {
  const mergedFilters = { limit: 1000, ...filters }
  return apiFetch<PromiseBrief[]>('/promises/', mergedFilters)
}

export async function getPromiseDetail(id: number): Promise<PromiseDetail> {
  return apiFetch<PromiseDetail>(`/promises/${id}`)
}

// ─── POLICIES ─────────────────────────────────────────────────────────────────

export async function getPolicies(filters?: {
  sector?: string
  status?: string
  election_cycle?: string
  search?: string
  skip?: number
  limit?: number
}): Promise<PolicyBrief[]> {
  const mergedFilters = { limit: 1000, ...filters }
  return apiFetch<PolicyBrief[]>('/policies/', mergedFilters)
}

export async function getPolicyDetail(id: number): Promise<PolicyDetail> {
  return apiFetch<PolicyDetail>(`/policies/${id}`)
}

// ─── STATE POLICIES ───────────────────────────────────────────────────────────

export interface StatePolicy {
  id: number
  policy_name: string
  state_name: string
  sector: string
  description: string
  launch_year: number
  status: string
  source_url: string
}

export async function getStatePolicies(filters?: {
  state?: string
  sector?: string
  year?: number
}): Promise<StatePolicy[]> {
  return apiFetch<StatePolicy[]>('/state-policies', filters)
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export async function getBudgetsTrends(filters?: {
  sector?: string
  year?: number
}): Promise<BudgetTrend[]> {
  // backend supports sector; year is ignored (kept for compatibility with UI filters)
  return apiFetch<BudgetTrend[]>('/budgets/trends', filters)
}

export async function getBudgetPromiseAlignment(): Promise<BudgetPromiseAlignment[]> {
  return apiFetch<BudgetPromiseAlignment[]>('/budgets/promise-alignment')
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

export async function getTimelineEvents(filters?: {
  sector?: string
  year?: number
  event_type?: string
}): Promise<TimelineEvent[]> {
  return apiFetch<TimelineEvent[]>('/timeline/events', filters)
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary')
}

export async function getDashboardRecentActivity(limit = 10): Promise<RecentActivity[]> {
  return apiFetch<RecentActivity[]>('/dashboard/recent-activity', { limit })
}

export async function getDashboardSectorPerformance(): Promise<SectorPerformanceRow[]> {
  return apiFetch<SectorPerformanceRow[]>('/dashboard/sector-performance')
}

export async function getSectors(): Promise<SectorOut[]> {
  return apiFetch<SectorOut[]>('/sectors/')
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────

export interface AIAskPayload {
  question: string
  election_cycle?: string
  sector?: string
}

export interface AIAskResult {
  answer: string
  evidence: any[]
  suggestions: string[]
}

export async function apiAskAI(payload: AIAskPayload): Promise<AIAskResult> {
  let url: URL;
  try {
    const fullPath = `${API_BASE}/ai/ask`.replace(/\/\//g, '/').replace(':/', '://');
    url = new URL(fullPath, typeof window !== 'undefined' ? window.location.origin : undefined);
  } catch (e) {
    url = new URL(`${API_BASE}/ai/ask`, 'http://localhost:3000');
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: /ai/ask`)
  return (await res.json()) as AIAskResult
}

// ─── GOVERNANCE MAP ───────────────────────────────────────────────────────────

export async function getGovernanceMapData(): Promise<GovernanceMapData> {
  // Build graph from promises + policies from the backend
  try {
    const [promises, policies, statePolicies] = await Promise.all([
      getPromises({ limit: 50 }),
      getPolicies({ limit: 50 }),
      getStatePolicies()
    ])

    const nodes: GovernanceMapData['nodes'] = []
    const links: GovernanceMapData['links'] = []
    const sectorSet = new Set<string>()

    // Add sector nodes
    promises.forEach(p => { if (p.sector?.name) sectorSet.add(p.sector.name) })
    policies.forEach(p => { if (p.sector?.name) sectorSet.add(p.sector.name) })
    sectorSet.forEach(s => nodes.push({ id: `sector-${s}`, name: s, type: 'sector', val: 12, color: '#6366f1' }))

    // Add promise nodes + links to sector
    promises.slice(0, 30).forEach(p => {
      nodes.push({ id: `promise-${p.id}`, name: p.text.slice(0, 60), type: 'promise', val: 5, color: '#22c55e' })
      if (p.sector?.name) links.push({ source: `sector-${p.sector.name}`, target: `promise-${p.id}`, label: 'has promise' })
    })

    // Add policy nodes + links to sector
    policies.slice(0, 30).forEach(p => {
      nodes.push({ id: `policy-${p.id}`, name: p.name, type: 'policy', val: 8, color: '#3b82f6' })
      if (p.sector?.name) links.push({ source: `sector-${p.sector.name}`, target: `policy-${p.id}`, label: 'has policy' })
    })

    // Add state policy nodes + links to sector
    statePolicies.slice(0, 30).forEach(sp => {
      nodes.push({ id: `state-policy-${sp.id}`, name: `${sp.policy_name} (${sp.state_name})`, type: 'state_policy', val: 7, color: '#f59e0b' })
      if (sp.sector) links.push({ source: `sector-${sp.sector}`, target: `state-policy-${sp.id}`, label: 'state policy' })
    })

    return { nodes, links }
  } catch {
    return { nodes: [], links: [] }
  }
}

// ─── ACCOUNTABILITY ───────────────────────────────────────────────────────────

export interface AccountabilitySummary {
  total_promises: number
  promises_with_policy: number
  promises_fulfilled: number
  promises_no_progress: number
  policy_coverage_pct: number
  fulfillment_pct: number
  sectors_with_budget: number
  bills_passed: number
  bills_implemented: number
}

export interface SectorAccountability {
  sector: string
  total_promises: number
  promises_with_policy: number
  avg_fulfillment_score: number
  has_budget: boolean
  bills_passed: number
  accountability_score: number
}

export interface AccountabilityGap {
  promise_id: number
  promise_text: string
  sector: string | null
  status: string
  fulfillment_score: number
}

export async function getAccountabilitySummary(): Promise<AccountabilitySummary> {
  return apiFetch<AccountabilitySummary>('/accountability/summary')
}

export async function getAccountabilitySectors(): Promise<SectorAccountability[]> {
  return apiFetch<SectorAccountability[]>('/accountability/sectors')
}

export async function getAccountabilityGaps(limit = 20): Promise<AccountabilityGap[]> {
  return apiFetch<AccountabilityGap[]>('/accountability/gaps', { limit })
}

// ─── BILLS ────────────────────────────────────────────────────────────────────

export interface BillBrief {
  id: number
  name: string
  ministry: string | null
  status: string
  introduced_date: string | null
  source_url: string | null
}

export interface BillTimelineEvent {
  date: string | null
  stage: string
  description: string | null
  source_url: string | null
}

export interface BillTimelineResponse {
  bill_id: number
  bill_name: string
  ministry: string | null
  status: string
  timeline: BillTimelineEvent[]
}

export async function getBills(filters?: {
  status?: string
  ministry?: string
  skip?: number
  limit?: number
}): Promise<BillBrief[]> {
  return apiFetch<BillBrief[]>('/bills/', filters)
}

export async function getBillTimeline(billId: number): Promise<BillTimelineResponse> {
  return apiFetch<BillTimelineResponse>(`/bills/${billId}/timeline`)
}

// ─── BUDGET PIPELINE ──────────────────────────────────────────────────────────

export interface BudgetSectorData {
  sector: string
  budget: number
}

export interface BudgetTrendPipeline {
  year: number
  sector: string
  budget: number
}

export interface BudgetDistribution {
  sector: string
  budget: number
  percentage: number
}

export async function getBudgetPipelineSectors(year?: number): Promise<BudgetSectorData[]> {
  return apiFetch<BudgetSectorData[]>('/budget/sectors', year ? { year } : undefined)
}

export async function getBudgetPipelineTrend(sector?: string): Promise<BudgetTrendPipeline[]> {
  return apiFetch<BudgetTrendPipeline[]>('/budget/trend', sector ? { sector } : undefined)
}

export async function getBudgetDistribution(year?: number): Promise<BudgetDistribution[]> {
  return apiFetch<BudgetDistribution[]>('/budget/distribution', year ? { year } : undefined)
}

// ─── SIMILARITY SEARCH ───────────────────────────────────────────────────────

export interface SimilarPolicy {
  id: number
  name: string
  description: string | null
  year_introduced: number
  status: string
  ministry: string | null
  sector: string | null
  similarity: number
}

export interface SimilarBill {
  id: number
  name: string
  ministry: string | null
  status: string
  introduced_date: string | null
  similarity: number
}

export async function findSimilarPolicies(params: {
  policy_id?: number
  query?: string
  top_k?: number
}): Promise<SimilarPolicy[]> {
  return apiFetch<SimilarPolicy[]>('/similarity/similar', params)
}

export async function findSimilarBills(params: {
  bill_id?: number
  query?: string
  top_k?: number
}): Promise<SimilarBill[]> {
  return apiFetch<SimilarBill[]>('/similarity/bills/similar', params)
}

// --- Chat & Assistant Interfaces ---

export interface ChatMessage {
  id?: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  user_id?: string;
  session_title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface UploadedDocument {
  id: number;
  session_id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

export interface AiChatResponse {
  answer: string;
  reasoning?: string;
  tools_used: string[];
}

// --- Chat & Assistant Endpoints ---

export async function createChatSession(payload: { user_id?: string; session_title?: string }) {
  return apiFetch<ChatSession>('/api/ai/chat/session', undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function getChatSessions() {
  return apiFetch<ChatSession[]>('/api/ai/chat/sessions');
}

export async function getChatHistory(sessionId: string) {
  return apiFetch<ChatSession>(`/api/ai/chat/history/${sessionId}`);
}

export async function uploadDocument(sessionId: string, file: File) {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('file', file);

  let base = API_BASE;
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  const url = `${base}/api/ai/chat/upload`.replace(/\/\//g, '/').replace(':/', '://');
  
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json() as Promise<UploadedDocument>;
}

export async function sendChatMessage(payload: { session_id: string; message: string }) {
  return apiFetch<AiChatResponse>('/api/ai/chat/message', undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
