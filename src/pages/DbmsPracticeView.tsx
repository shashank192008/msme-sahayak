/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Copy,
  Check,
  FileCode,
  Terminal,
  Layers,
  ArrowRight,
  BookOpen,
  Table as TableIcon,
} from 'lucide-react';
import { api } from '../services/api';

interface Concept {
  id: string;
  concept_name: string;
  category: string;
  description: string;
  sql_query: string;
  explanation: string;
}

export const DbmsPracticeView: React.FC = () => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [executionMode, setExecutionMode] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const res = await api.getDbmsQueries();
      setConcepts(res.data);
      if (res.data.length > 0) {
        setSelectedConcept(res.data[0]);
        runQuery(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runQuery = async (conceptId: string) => {
    setRunning(true);
    try {
      const res = await api.runDbmsQuery(conceptId);
      setQueryResults(res.rows);
      setExecutionMode(res.execution_mode);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const handleSelect = (c: Concept) => {
    setSelectedConcept(c);
    runQuery(c.id);
  };

  const handleCopy = () => {
    if (!selectedConcept) return;
    navigator.clipboard.writeText(selectedConcept.sql_query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['ALL', ...Array.from(new Set(concepts.map(c => c.category)))];

  const filteredConcepts = concepts.filter(c => {
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0F2942] text-white font-bold">
              DBMS Viva & Practical Lab
            </span>
            <span className="text-xs text-slate-500">30+ MySQL Concepts Tested</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            DBMS Practice & Evaluation Query Runner
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Interactive SQL execution console for college hackathon judges, verifying relational algebra, joins, subqueries, views, and transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 p-2 rounded-lg text-slate-700">
          <Database className="w-4 h-4 text-[#0D9488]" />
          <span>database/dbms_practice_queries.sql</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1 bg-white p-2 rounded-lg border border-slate-200 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold px-2">Category:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-md transition-all font-medium ${
              categoryFilter === cat
                ? 'bg-[#0F2942] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Console Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Concept List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-3 space-y-1.5 max-h-[650px] overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Curated Practice Queries ({filteredConcepts.length})
          </div>

          {filteredConcepts.map(c => {
            const isSelected = selectedConcept?.id === c.id;

            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-[#0F2942] bg-[#0F2942]/5 ring-1 ring-[#0F2942]'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono uppercase font-bold text-[#0D9488]">{c.category}</span>
                  {isSelected && <span className="text-slate-500 font-sans">Active</span>}
                </div>
                <div className="font-bold text-xs text-[#0F2942] mt-1">{c.concept_name}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
              </button>
            );
          })}
        </div>

        {/* Right: SQL Editor & Result Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedConcept && (
            <>
              {/* Concept Metadata Card */}
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedConcept.category}
                    </span>
                    <h3 className="text-base font-bold font-heading text-[#0F2942] mt-1.5">
                      {selectedConcept.concept_name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">{selectedConcept.description}</p>
                  </div>

                  <button
                    onClick={() => runQuery(selectedConcept.id)}
                    disabled={running}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#006F66] rounded-md transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                    <span>{running ? 'Executing...' : 'Run Query'}</span>
                  </button>
                </div>

                {/* Explanation text */}
                <div className="mt-3.5 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Concept Theory: </span>
                  {selectedConcept.explanation}
                </div>
              </div>

              {/* SQL Statement Box */}
              <div className="bg-[#0B1C30] rounded-lg overflow-hidden border border-slate-700 shadow-md">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#86F2E4]" />
                    <span className="font-mono text-[11px] text-slate-300">MySQL 8.0 Statement</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>

                <div className="p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-[#86F2E4] leading-relaxed whitespace-pre">
                    {selectedConcept.sql_query}
                  </pre>
                </div>
              </div>

              {/* Output Result Dataset Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <TableIcon className="w-4 h-4 text-slate-500" />
                    <span>Query Execution Result</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Engine: <strong className="text-[#0F2942]">{executionMode || 'MySQL Pool'}</strong> · {queryResults ? `${queryResults.length} rows returned` : '0 rows'}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[320px]">
                  {queryResults && queryResults.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                        <tr>
                          {Object.keys(queryResults[0]).map(key => (
                            <th key={key} className="py-2.5 px-3 border-b border-slate-200">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {queryResults.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                                {val === null || val === undefined ? (
                                  <span className="text-slate-300 italic">NULL</span>
                                ) : typeof val === 'number' ? (
                                  val.toLocaleString('en-IN')
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Click "Run Query" to execute this SQL statement on the live database.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
