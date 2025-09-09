"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Dashboard() {
  const recentCases = useQuery(api.cases.getRecentCases, { limit: 10 });
  const recentRulings = useQuery(api.rulings.getRecentRulings, { limit: 10 });
  const recentEvidence = useQuery(api.evidence.getRecentEvidence, { limit: 10 });

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Agent Court Dashboard
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-500">Convergence v0.1</div>
            <div className="text-xs text-gray-400">Basic Court System</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Recent Cases
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {recentCases?.length || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Recent Rulings
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {recentRulings?.length || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Evidence Submitted
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {recentEvidence?.length || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Cases
            </h3>
            <div className="space-y-3">
              {recentCases?.slice(0, 5).map((case_) => (
                <div key={case_._id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {case_.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {case_.parties.length} parties
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    case_.status === 'FILED' ? 'bg-yellow-100 text-yellow-800' :
                    case_.status === 'DECIDED' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {case_.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Rulings
            </h3>
            <div className="space-y-3">
              {recentRulings?.slice(0, 5).map((ruling) => (
                <div key={ruling._id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {ruling.code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ruling.auto ? 'Auto-ruled' : 'Panel decision'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    ruling.verdict === 'UPHELD' ? 'bg-red-100 text-red-800' :
                    ruling.verdict === 'DISMISSED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ruling.verdict}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
