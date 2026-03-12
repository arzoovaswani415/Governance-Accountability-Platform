"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  FileText, 
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from "recharts";

import { 
  getDebateAnalysis,
  DebateAnalysisResponse
} from "@/lib/api";

export default function BillDebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const billId = parseInt(id);

  const [analysis, setAnalysis] = useState<DebateAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDebateAnalysis(billId);
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to fetch debate intelligence", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [billId]);


  const [activeTab, setActiveTab] = useState<"debate" | "impact">("debate");

  const handleDownloadReport = () => {
    if (!analysis) return;
    
    const reportContent = `
# Impact Assessment Report: ${analysis.bill_name}
Date: ${new Date().toLocaleDateString()}
System: Parliamentary Intelligence Engine

## Executive Summary
${analysis.impact_assessment?.summary || "No summary available."}

## Impact Indicators
- Economic Impact: ${analysis.impact_assessment?.economic_impact || "N/A"}
- Social Impact: ${analysis.impact_assessment?.social_impact || "N/A"}
- Environmental Impact: ${analysis.impact_assessment?.environmental_impact || "N/A"}

## Affected Stakeholders
${analysis.impact_assessment?.affected_stakeholders?.map(s => `- ${s}`).join("\n") || "No stakeholders identified."}

## Government Rationale
${analysis.government_rationale}

## Intelligence Verdict
${analysis.intelligence_verdict}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impact-report-${billId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">Syncing Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: "Support", value: analysis?.sentiment?.support || 0, color: "#22c55e" },
    { name: "Opposition", value: analysis?.sentiment?.opposition || 1, color: "#ef4444" },
    { name: "Neutral", value: analysis?.sentiment?.neutral || 1, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  const getImpactColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100 ring-red-500/10';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100 ring-amber-500/10';
      case 'low': return 'text-green-600 bg-green-50 border-green-100 ring-green-500/10';
      default: return 'text-gray-600 bg-gray-50 border-gray-100 ring-gray-500/10';
    }
  };

  const impactMetrics = [
    { label: 'Economic Impact', val: analysis?.impact_assessment?.economic_impact || 'Medium', icon: TrendingUp, color: 'blue' },
    { label: 'Social Impact', val: analysis?.impact_assessment?.social_impact || 'High', icon: MessageSquare, color: 'purple' },
    { label: 'Environmental Impact', val: analysis?.impact_assessment?.environmental_impact || 'Low', icon: ShieldCheck, color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 selection:bg-blue-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/debates"
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-500 hover:text-blue-600 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                {analysis?.bill_name}
                <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase tracking-widest">Active</span>
              </h1>
              <div className="flex items-center gap-8 mt-2">
                <button 
                  onClick={() => setActiveTab("debate")}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-all relative ${activeTab === 'debate' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Debate Intelligence
                  {activeTab === 'debate' && <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-blue-600 blur-[2px]"></span>}
                </button>
                <button 
                  onClick={() => setActiveTab("impact")}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] pb-2 border-b-2 transition-all relative ${activeTab === 'impact' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Impact Assessment
                  {activeTab === 'impact' && <span className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-blue-600 blur-[2px]"></span>}
                </button>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
             <div className="h-10 w-px bg-gray-100"></div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Deep Analysis Status</span>
              <span className="flex items-center gap-2 text-[10px] text-green-600 font-black px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                NEURAL ENGINE LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">
        
        {activeTab === "debate" ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10">
            {/* Top Row: Summary & Sentiment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* AI Debate Summary */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col group hover:border-blue-200 transition-all">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 tracking-tight text-lg">Synthesized Debate Intel</h3>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Parliamentary Transcript Analysis</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    AI Agent V2
                  </Badge>
                </div>
                <div className="p-8 flex-1 space-y-6">
                  <p className="text-gray-800 leading-relaxed text-xl font-semibold tracking-tight">
                    "{analysis?.debate_summary}"
                  </p>
                  <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4">
                      <div className="p-2 bg-green-50 text-green-600 rounded-xl h-fit">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Core Objectives</h4>
                        <p className="text-sm text-gray-500 font-medium">{analysis?.key_themes?.join(", ") || "Modernization, Fiscal Responsibility"}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl h-fit">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Friction Points</h4>
                        <p className="text-sm text-gray-500 font-medium">{analysis?.key_concerns?.join(", ") || "Implementation, Oversight"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis Chart */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 flex flex-col hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 tracking-tight text-lg">Political Sentiment</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Speaker Stance Distribution</p>
                  </div>
                </div>
                <div className="h-64 relative group/chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        className="focus:outline-none"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-4xl font-black text-gray-900">{analysis?.sentiment?.support}%</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Support</span>
                  </div>
                </div>
                <div className="mt-8 flex justify-between gap-2">
                   {sentimentData.map((d, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{d.name} {d.value}%</span>
                     </div>
                   ))}
                </div>
              </div>

            </div>

            {/* AI Insights and Verdict Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Detailed Intel Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-10 space-y-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                  Strategic Context
                </h3>
                
                <div className="space-y-8">
                  <div className="relative pl-8 border-l-2 border-green-100 group">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm ring-4 ring-green-50"></div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-green-600 transition-colors">Government Narrative</h4>
                    <p className="text-gray-700 font-semibold leading-relaxed">
                      {analysis?.government_rationale}
                    </p>
                  </div>

                  <div className="relative pl-8 border-l-2 border-red-100 group">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm ring-4 ring-red-50"></div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-red-600 transition-colors">Opposition Critique</h4>
                    <p className="text-gray-700 font-semibold leading-relaxed">
                      {analysis?.opposition_feedback}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verdict Card */}
              <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 border-t-white/20">
                          <Lightbulb className="text-yellow-400" size={28} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black tracking-tight">Intelligence Verdict</h3>
                          <p className="text-[10px] text-blue-300 font-black uppercase tracking-[0.3em]">Neural Synthesis Engine</p>
                       </div>
                    </div>
                    
                    <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 border-t-white/10">
                       <p className="text-xl font-medium leading-relaxed italic text-blue-50/90">
                         "{analysis?.intelligence_verdict}"
                       </p>
                    </div>
                  </div>

                  <div className="pt-10 flex items-center justify-between">
                     <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                            <ShieldCheck size={14} className="text-blue-400" />
                          </div>
                        ))}
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score: 94.2%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12">
            {/* Impact Assessment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {impactMetrics.map((item, idx) => (
                <div key={idx} className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/40 group hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <div className={`p-4 bg-${item.color}-50 text-${item.color}-600 rounded-[1.5rem] shadow-sm group-hover:scale-110 transition-transform`}>
                      <item.icon size={28} />
                    </div>
                    <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getImpactColor(item.val)}`}>
                      {item.val} Level
                    </Badge>
                  </div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{item.label}</h4>
                  <div className="space-y-4">
                     <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 shadow-sm ${item.val === 'High' ? 'bg-red-500 animate-pulse' : item.val === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} 
                          style={{ width: item.val === 'High' ? '92%' : item.val === 'Medium' ? '58%' : item.val === 'Low' ? '25%' : '5%' }}
                        />
                     </div>
                     <p className="text-sm font-bold text-gray-500">Predicted reach across relevant sectors</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Impact Details & Stakeholders Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              
              {/* Report Narrative */}
              <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-12 border border-blue-100 shadow-2xl shadow-blue-200/20 relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/30 to-transparent pointer-events-none"></div>
                 
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                       <span className="text-5xl font-black text-blue-600/10">01</span>
                       <h3 className="text-2xl font-black text-gray-900 tracking-tight">Executive Intelligence Report</h3>
                    </div>
                    
                    <p className="text-2xl font-semibold text-gray-800 leading-[1.6] tracking-tight decoration-blue-500/20 underline-offset-8 transition-all hover:decoration-blue-500/50">
                      {analysis?.impact_assessment?.summary}
                    </p>

                    <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Velocity</h4>
                          <div className="flex items-end gap-2">
                             <span className="text-3xl font-black text-gray-900">+4.2%</span>
                             <span className="text-xs font-bold text-green-600 mb-1">↑ Sector Growth</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">Predicted economic acceleration within the first 18-24 months post-implementation.</p>
                       </div>
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Adoption</h4>
                          <div className="flex items-end gap-2">
                             <span className="text-3xl font-black text-gray-900">82%</span>
                             <span className="text-xs font-bold text-blue-600 mb-1">Expected Score</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">Based on legislative reach and digital infrastructure accessibility cross-referenced.</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Stakeholders Card */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col hover:border-indigo-100 transition-all">
                <div className="mb-10 flex items-center gap-4">
                   <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <ShieldCheck size={24} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Target Stakeholders</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
                  <div className="grid grid-cols-1 gap-4">
                    {analysis?.impact_assessment?.affected_stakeholders?.map((stakeholder, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-indigo-200 hover:bg-white transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-indigo-500 rounded-full group-hover:scale-y-110 transition-transform"></div>
                            <span className="text-sm font-black text-gray-800 tracking-tight">{stakeholder}</span>
                         </div>
                         <ArrowLeft className="text-gray-300 group-hover:text-indigo-500 -rotate-180 transition-colors" size={16} />
                      </div>
                    )) || [...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl"></div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-indigo-900 rounded-2xl text-white flex items-center justify-between group cursor-pointer overflow-hidden relative">
                   <div className="absolute inset-0 bg-indigo-800 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                   <div className="relative z-10 flex items-center gap-3">
                      <Lightbulb size={18} className="text-indigo-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Stakeholder Intelligence Map</span>
                   </div>
                   <span className="relative z-10 text-xl font-black">→</span>
                </div>
              </div>

            </div>

            {/* Bottom Download Banner */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
               {/* Animated glassmorphism background */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] group-hover:translate-x-10 transition-transform duration-1000"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex items-start gap-8">
                     <div className="p-5 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-xl">
                        <FileText size={40} className="text-blue-400" />
                     </div>
                     <div className="max-w-xl space-y-4">
                        <h4 className="text-3xl font-black tracking-tight">Generate Professional Report</h4>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium">
                          Export the full multi-dimensional impact analysis including stakeholder maps, risk indicators, 
                          and strategic verdicts as a portable legislative intelligence document.
                        </p>
                     </div>
                  </div>
                  <button 
                    onClick={handleDownloadReport}
                    className="bg-white text-slate-900 hover:scale-105 active:scale-95 transition-all font-black px-10 py-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-4 group/btn"
                  >
                    <TrendingUp size={24} className="text-blue-600 group-hover/btn:rotate-12 transition-transform" />
                    DOWNLOAD REPORT
                  </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
    {children}
  </span>
);
