import React, { useState } from 'react';
import { 
  FileSpreadsheet, Filter, Search, Download, 
  Calendar, Layers, ArrowUpDown, Database, BarChart3 
} from 'lucide-react';
import { SensorData, Language } from '../types/database';
import { translations } from '../lib/translations';

interface ReportsProps {
  sensorData: SensorData[];
  lang: Language;
}

export const Reports: React.FC<ReportsProps> = ({ sensorData, lang }) => {
  const t = translations[lang];

  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter sensor readings
  const filteredData = sensorData.filter((item) => {
    const matchesField = selectedFieldFilter === 'ALL' || item.field_no === selectedFieldFilter;
    const matchesSearch = 
      item.field_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.moisture.toString().includes(searchTerm) ||
      item.temperature.toString().includes(searchTerm);
    return matchesField && matchesSearch;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortAsc ? timeA - timeB : timeB - timeA;
  });

  // Unique list of fields
  const uniqueFields = Array.from(new Set(sensorData.map(d => d.field_no)));

  // KPI calculations
  const totalCount = filteredData.length;
  const avgMoisture = totalCount > 0 
    ? (filteredData.reduce((acc, curr) => acc + curr.moisture, 0) / totalCount).toFixed(1)
    : '0';
  const avgTemp = totalCount > 0
    ? (filteredData.reduce((acc, curr) => acc + curr.temperature, 0) / totalCount).toFixed(1)
    : '0';

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ['Timestamp', 'Field No', 'Moisture (%)', 'Temperature (°C)', 'Humidity (%)', 'NPK (PPM)', 'Growth Height (cm)'];
    const rows = filteredData.map(d => [
      new Date(d.created_at).toLocaleString(),
      `"${d.field_no}"`,
      d.moisture,
      d.temperature,
      d.humidity,
      d.npk,
      d.growth_height
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Payir_Telemetry_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & KPI Summary */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              {t.reportsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.reportsSubtitle}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/80 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportCsv}</span>
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.totalRecords}</div>
              <div className="text-xl font-extrabold text-white mt-0.5">{totalCount}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.avgMoisture}</div>
              <div className="text-xl font-extrabold text-cyan-400 mt-0.5">{avgMoisture}%</div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.avgTemp}</div>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">{avgTemp}°C</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Field Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Filter className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedFieldFilter}
              onChange={(e) => setSelectedFieldFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Fields</option>
              {uniqueFields.map((fieldNo, idx) => (
                <option key={idx} value={fieldNo} className="bg-slate-900">{fieldNo}</option>
              ))}
            </select>
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sort: {sortAsc ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.filterSearch}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 text-xs font-semibold pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Data Warehouse Telemetry Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-4 px-6">{t.dateHeader}</th>
                <th className="py-4 px-6">{t.fieldNoHeader}</th>
                <th className="py-4 px-6">{t.moistureHeader}</th>
                <th className="py-4 px-6">{t.tempHeader}</th>
                <th className="py-4 px-6">{t.humidityHeader}</th>
                <th className="py-4 px-6">{t.npkHeader}</th>
                <th className="py-4 px-6">{t.growthHeightHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No sensor telemetry data match your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-100 whitespace-nowrap">
                      {row.field_no}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-cyan-400">{row.moisture}%</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-amber-400">{row.temperature}°C</span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
                      {row.humidity}%
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-violet-400">{row.npk} PPM</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-emerald-400">{row.growth_height} cm</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
