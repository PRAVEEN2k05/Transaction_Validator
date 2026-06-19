import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, ChevronDown, ChevronUp, AlertCircle, 
  HelpCircle, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationRow {
  row_index: number;
  status: string;  // "Valid", "Invalid", "Warning"
  errors: string[];
  suggestion: string | null;
  data: Record<string, string>;
}

interface ValidationResultsTabProps {
  results: ValidationRow[];
}

type SortField = 'row_index' | 'status' | 'order_id' | 'customer_name' | 'date';
type SortOrder = 'asc' | 'desc';

export const ValidationResultsTab: React.FC<ValidationResultsTabProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  const [sortField, setSortField] = useState<SortField>('row_index');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  
  const itemsPerPage = 10;

  // Extract unique filters from data
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    results.forEach(r => {
      const c = r.data.country;
      if (c && c.trim() !== '') countries.add(c.trim());
    });
    return ['All', ...Array.from(countries).sort()];
  }, [results]);

  const uniquePaymentModes = useMemo(() => {
    const modes = new Set<string>();
    results.forEach(r => {
      const p = r.data.payment_mode;
      if (p && p.trim() !== '') {
        modes.add(p.trim().replace(/\b\w/g, c => c.toUpperCase()));
      }
    });
    return ['All', ...Array.from(modes).sort()];
  }, [results]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let output = [...results];

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      output = output.filter(r => 
        (r.data.customer_name?.toLowerCase().includes(q)) ||
        (r.data.order_id?.toLowerCase().includes(q)) ||
        (r.data.phone?.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      output = output.filter(r => r.status === statusFilter);
    }

    // Filter by country
    if (countryFilter !== 'All') {
      output = output.filter(r => r.data.country === countryFilter);
    }

    // Filter by payment mode
    if (paymentFilter !== 'All') {
      output = output.filter(r => {
        const p = r.data.payment_mode || '';
        return p.toLowerCase() === paymentFilter.toLowerCase();
      });
    }

    // Sort Data
    output.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'row_index') {
        valA = a.row_index;
        valB = b.row_index;
      } else if (sortField === 'status') {
        valA = a.status;
        valB = b.status;
      } else if (sortField === 'order_id') {
        valA = a.data.order_id || '';
        valB = b.data.order_id || '';
      } else if (sortField === 'customer_name') {
        valA = a.data.customer_name || '';
        valB = b.data.customer_name || '';
      } else if (sortField === 'date') {
        valA = a.data.transaction_date || '';
        valB = b.data.transaction_date || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return output;
  }, [results, searchTerm, statusFilter, countryFilter, paymentFilter, sortField, sortOrder]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));
  
  // Reset current page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countryFilter, paymentFilter]);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage]);

  const toggleRowExpand = (rowIdx: number) => {
    setExpandedRow(expandedRow === rowIdx ? null : rowIdx);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Valid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          Valid
        </span>
      );
    } else if (status === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          Warning
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3 h-3" />
          Invalid
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Search & Filter Bar */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search ID, name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-9 pr-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 bg-white/50 dark:bg-zinc-950/20"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900"
            >
              <option value="All">All Records</option>
              <option value="Valid">Valid</option>
              <option value="Invalid">Invalid</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Filter Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="glass-input px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900"
            >
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400">Filter Payment Mode</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="glass-input px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900"
            >
              {uniquePaymentModes.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Payment Modes' : m}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800/80">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/30">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('row_index')}>
                  <div className="flex items-center gap-1.5">
                    Row ID
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    Status
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('order_id')}>
                  <div className="flex items-center gap-1.5">
                    Order ID
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer_name')}>
                  <div className="flex items-center gap-1.5">
                    Customer Name
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1.5">
                    Date
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Expand</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 bg-transparent">
              {pagedData.length > 0 ? (
                pagedData.map((row) => {
                  const isExpanded = expandedRow === row.row_index;
                  const rowColor = row.status === 'Invalid' 
                    ? 'hover:bg-rose-500/5 dark:hover:bg-rose-500/2 bg-rose-500/2 dark:bg-rose-950/5' 
                    : row.status === 'Warning' 
                      ? 'hover:bg-amber-500/5 dark:hover:bg-amber-500/2 bg-amber-500/2 dark:bg-amber-950/5' 
                      : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/10';

                  return (
                    <React.Fragment key={row.row_index}>
                      <tr 
                        className={`transition-colors duration-150 cursor-pointer ${rowColor}`}
                        onClick={() => toggleRowExpand(row.row_index)}
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold text-zinc-600 dark:text-zinc-400">
                          {row.row_index}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm">
                          {getStatusBadge(row.status)}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {row.data.order_id || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                          {row.data.customer_name || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                          {row.data.phone || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">
                          {row.data.country || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-300">
                          {row.data.payment_mode || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {row.data.transaction_date || <span className="text-zinc-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </td>
                      </tr>

                      {/* Expandable AI details block */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-b border-zinc-200/50 dark:border-zinc-800/50">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-4 overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  
                                  {/* Error list card */}
                                  <div className="glass-card p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs mb-2">
                                      <AlertCircle className="w-4 h-4" />
                                      Validation Issues
                                    </div>
                                    <ul className="list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                                      {row.errors.length > 0 ? (
                                        row.errors.map((err, i) => (
                                          <li key={i}>{err}</li>
                                        ))
                                      ) : (
                                        <li className="text-emerald-600 dark:text-emerald-400 list-none">No active validation errors.</li>
                                      )}
                                    </ul>
                                  </div>

                                  {/* AI Suggestion card */}
                                  <div className="glass-card p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-600/5 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs mb-2">
                                      <HelpCircle className="w-4 h-4 text-violet-500" />
                                      AI Explanation & Suggestion
                                    </div>
                                    <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
                                      <span className="font-semibold text-violet-600 dark:text-violet-400">Suggestion: </span>
                                      {row.suggestion || "No suggestions needed, records are fully standard."}
                                    </div>
                                  </div>

                                </div>

                                {/* Raw Details Data */}
                                <div className="text-[10px] text-zinc-400 font-mono flex flex-wrap gap-x-4 gap-y-1 bg-zinc-100/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                  {Object.entries(row.data).map(([k, v]) => (
                                    <div key={k}>
                                      <span className="font-bold text-zinc-500">{k}:</span> {v || 'null'}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-zinc-400">
                    No results matching the active search or filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <span className="text-xs text-zinc-500">
            Showing <span className="font-bold text-zinc-700 dark:text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              {Math.min(currentPage * itemsPerPage, processedData.length)}
            </span>{' '}
            of <span className="font-bold text-zinc-700 dark:text-zinc-300">{processedData.length}</span> records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center text-xs font-semibold px-2 text-zinc-600 dark:text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
