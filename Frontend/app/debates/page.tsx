"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { getBills, BillBrief } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function DebatesExplorer() {
  const [bills, setBills] = useState<BillBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getBills();
        setBills(data);
      } catch (err) {
        console.error("Failed to load bills for debates", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredBills = bills.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.ministry && b.ministry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Parliamentary Debates</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Explore legislative evolution and parliamentary intelligence</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by bill name or ministry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Loading Intelligence Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredBills.map((bill) => (
              <Link 
                key={bill.id}
                href={`/bills/${bill.id}/debate`}
                className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[4rem] group-hover:bg-blue-100/50 transition-colors -z-0"></div>
                
                <div className="relative z-10 space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <MessageSquare size={18} />
                    </div>
                    <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] font-bold tracking-wider px-2 py-0.5 border-gray-200">
                      {bill.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {bill.name}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                      {bill.ministry || "Union Government"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        {bill.introduced_date ? new Date(bill.introduced_date).getFullYear() : "2024"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-blue-600">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Analyze</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredBills.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
              <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No bills found</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2 italic">Try searching for different keywords or ministries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
