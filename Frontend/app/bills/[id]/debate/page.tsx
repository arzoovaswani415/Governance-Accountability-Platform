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
  getDebateSummary, 
  getDebateTimeline, 
  getDebateSentiment,
  DebateSummaryResponse,
  DebateTimelineResponse,
  DebateSentimentResponse
} from "@/lib/api";

export default function BillDebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const billId = parseInt(id);

  const [summary, setSummary] = useState<DebateSummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<DebateTimelineResponse | null>(null);
  const [sentiment, setSentiment] = useState<DebateSentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sum, time, sent] = await Promise.all([
          getDebateSummary(billId),
          getDebateTimeline(billId),
          getDebateSentiment(billId)
        ]);
        setSummary(sum);
        setTimeline(time);
        setSentiment(sent);
      } catch (err) {
        console.error("Failed to fetch debate intelligence", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [billId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Analyzing Parliamentary Debates...</p>
        </div>
      </div>
    );
  }

  const sentimentData = [
    { name: "Support", value: sentiment?.support || 0, color: "#22c55e" },
    { name: "Opposition", value: sentiment?.opposition || 0, color: "#ef4444" },
    { name: "Neutral", value: sentiment?.neutral || 0, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/bills/${billId}`}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 truncate max-w-[300px] md:max-w-lg">
                {summary?.bill_name}
              </h1>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Parliamentary Debate Intelligence
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Status</span>
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                AI Analysis Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Top Row: Summary & Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI Debate Summary */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MessageSquare size={20} />
                </div>
                <h3 className="font-bold text-gray-800 tracking-tight">Debate Summary</h3>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full">AI Generated</span>
            </div>
            <div className="p-6 flex-1 space-y-4">
              <p className="text-gray-700 leading-relaxed text-lg font-medium italic">
                "{summary?.debate_summary}"
              </p>
              <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <ShieldCheck className="text-green-500 shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Key Themes</h4>
                    <p className="text-xs text-gray-500">{sentiment?.themes || "Modernization, Fiscal Responsibility, Infrastructure"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Key Concerns</h4>
                    <p className="text-xs text-gray-500">{sentiment?.concerns || "Oversight, State Autonomy, Implementation Timelines"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Analysis Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-gray-800 tracking-tight">Debate Sentiment</h3>
            </div>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-black text-gray-800">{sentiment?.support}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Support</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-center text-gray-500 font-medium">
              Based on statement analysis from the Parliamentary transcript.
            </p>
          </div>

        </div>

        {/* Policy Evolution Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-gray-800 tracking-tight">Policy Evolution Timeline</h3>
          </div>
          <div className="p-8 overflow-x-auto">
            <div className="flex min-w-[800px] relative">
              {/* Connector Line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-100 z-0"></div>
              
              {timeline?.timeline.map((event, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-4 relative z-10 px-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border-2 transition-all ${
                    event.stage === 'Passed' ? 'bg-green-500 border-green-600 text-white' : 
                    event.stage === 'Amendment' ? 'bg-amber-500 border-amber-600 text-white' :
                    'bg-white border-blue-600 text-blue-600'
                  }`}>
                    {event.stage === 'Passed' ? <CheckCircle2 size={24} /> : 
                     event.stage === 'Amendment' ? <FileText size={24} /> : 
                     <ShieldCheck size={24} />}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{event.stage}</p>
                    <p className="text-xs text-gray-400 font-bold">{event.date}</p>
                    <p className="text-[11px] text-gray-600 leading-tight max-w-[150px] mx-auto">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Amendments & AI Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Key Amendments List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-gray-800 tracking-tight">Amendment Extraction</h3>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[400px]">
              {summary?.key_amendments.map((am, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md mt-1 group-hover:scale-110 transition-transform">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">
                        {am.description}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-widest">
                        Proposed on {am.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {summary?.key_amendments.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-400 font-medium">No major amendments recorded for this bill.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Intelligence Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white p-8 shadow-xl relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                  <Lightbulb size={24} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">AI Intelligence Insight</h3>
                  <p className="text-xs text-blue-100 font-bold uppercase tracking-widest opacity-80">Synthesized Knowledge</p>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="p-1 h-fit bg-green-400/20 rounded-full mt-1">
                      <CheckCircle2 size={16} className="text-green-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-wide">Government Rationale</h4>
                      <p className="text-sm text-blue-50/80 leading-relaxed">
                        {sentiment?.rationale || "The primary driver behind this bill is to modernize regulatory frameworks and ensure ease of doing business."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-1 h-fit bg-red-400/20 rounded-full mt-1">
                      <AlertCircle size={16} className="text-red-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold tracking-wide">Opposition Feedback</h4>
                      <p className="text-sm text-blue-50/80 leading-relaxed">
                        {sentiment?.feedback || "Main concerns center around the centralization of power and potential impacts on state autonomy."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-200 mb-3">Intelligence Verdict</h4>
                  <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                    <p className="text-sm font-medium italic text-blue-50">
                      "{sentiment?.verdict || "The debate reflects dynamic friction between efficiency-seeking reform and existing procedural safeguards."}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
