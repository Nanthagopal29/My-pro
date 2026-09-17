import React, { useState, useEffect, useMemo } from 'react';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Date Filter States
  const [filterMode, setFilterMode] = useState('single'); // 'single' | 'range'
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Fetch data from your API
    const fetchData = async () => {
      try {
        const response = await fetch('https://hfapi.herofashion.com/imp_reports/sta/');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and group individual punch logs by employee code
  const groupedData = useMemo(() => {
    const map = new Map();

    // 1. Apply Date Filters First
    const filteredData = data.filter((record) => {
      if (!record.date) return true;

      // Safely parse the date from the record
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      const recordTime = recordDate.getTime();

      if (filterMode === 'single') {
        if (!selectedDate) return true; // No filter applied
        const target = new Date(selectedDate);
        target.setHours(0, 0, 0, 0);
        return recordTime === target.getTime();
      } else {
        // Date Range logic
        let isValid = true;
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (recordTime < start.getTime()) isValid = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (recordTime > end.getTime()) isValid = false;
        }
        return isValid;
      }
    });

    // 2. Group the Filtered Data
    filteredData.forEach((record) => {
      const empKey = record.code;
      if (!map.has(empKey)) {
        map.set(empKey, {
          code: record.code,
          name: record.name,
          cat: record.cat,
          date: record.date,
          punches: [],
        });
      }

      map.get(empKey).punches.push({
        slno: record.slno,
        date: record.date,
        intime: record.intime,
        outtime: record.outtime,
        duration: record.duration,
      });
    });

    // 3. Map aggregates
    return Array.from(map.values()).map((emp) => {
      // Calculate total duration (in minutes) across all sessions
      const totalMinutes = emp.punches.reduce((acc, curr) => {
        const dur = Number(curr.duration);
        return !isNaN(dur) ? acc + dur : acc;
      }, 0);

      // Check if employee has any session without an outtime
      const isCurrentlyActive = emp.punches.some((p) => !p.outtime);

      return {
        ...emp,
        totalMinutes,
        isCurrentlyActive,
      };
    });
  }, [data, filterMode, selectedDate, startDate, endDate]);

  // Calculate filtered punch totals dynamically
  const filteredPunchCount = groupedData.reduce((acc, emp) => acc + emp.punches.length, 0);

  // Clear filters helper
  const clearFilters = () => {
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="min-h-screen bg-slate-200 p-4 sm:p-8 font-sans">
      {/* Injecting the custom loader CSS */}
      <style>
        {`
          .loader {
            width: 48px;
            height: 48px;
            margin: auto;
            position: relative;
          }
          .loader:before {
            content: '';
            width: 48px;
            height: 5px;
            background: #f0808050;
            position: absolute;
            top: 60px;
            left: 0;
            border-radius: 50%;
            animation: shadow324 0.5s linear infinite;
          }
          .loader:after {
            content: '';
            width: 100%;
            height: 100%;
            background: #f08080;
            position: absolute;
            top: 0;
            left: 0;
            border-radius: 4px;
            animation: jump7456 0.5s linear infinite;
          }
          @keyframes jump7456 {
            15% { border-bottom-right-radius: 3px; }
            25% { transform: translateY(9px) rotate(22.5deg); }
            50% { transform: translateY(18px) scale(1, .9) rotate(45deg); border-bottom-right-radius: 40px; }
            75% { transform: translateY(9px) rotate(67.5deg); }
            100% { transform: translateY(0) rotate(90deg); }
          }
          @keyframes shadow324 {
            0%, 100% { transform: scale(1, 1); }
            50% { transform: scale(1.2, 1); }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Staff Attendance Summary
            </h1>
            <p className="text-slate-500 text-sm mt-1">Individual employee consolidated punch records</p>
          </div>
          
          {!loading && !error && (
            <div className="flex gap-3">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                Staff Members: <span className="text-blue-600 font-bold">{groupedData.length}</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                Total Punches: <span className="text-slate-900 font-bold">{filteredPunchCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        {!loading && !error && (
          <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg self-start md:self-auto">
              <button
                onClick={() => setFilterMode('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'single'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Single Date
              </button>
              <button
                onClick={() => setFilterMode('range')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'range'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Date Range
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {filterMode === 'single' ? (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium mb-1 ml-1">Select Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium mb-1 ml-1">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
                    />
                  </div>
                  <span className="text-slate-300 font-medium mt-5 hidden sm:block">to</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium mb-1 ml-1">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
                    />
                  </div>
                </>
              )}
              
              {(selectedDate || startDate || endDate) && (
                <button
                  onClick={clearFilters}
                  className="mt-5 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Clear Filters"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center p-6 bg-red-50 border border-red-100 rounded-xl shadow-sm">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-bold text-red-800 mb-1">Failed to load data</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          /* Responsive Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedData.map((emp) => (
              <div 
                key={emp.code} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
              >
                {/* Header: Employee Profile & Status */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                          {emp.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            ID: {emp.code}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                            {emp.cat}
                          </span>
                        </div>
                      </div>
                    </div>

                    {emp.isCurrentlyActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 shrink-0">
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Punch Logs Timeline / Table */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Punch History ({emp.punches.length})
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {emp.date}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {emp.punches.map((punch, idx) => (
                        <div 
                          key={`${punch.slno}-${idx}`} 
                          className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                IN: {punch.intime}
                              </span>
                              <span className="text-slate-300">→</span>
                              <span className={`font-semibold px-1.5 py-0.5 rounded ${punch.outtime ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
                                OUT: {punch.outtime ? punch.outtime : 'Pending'}
                              </span>
                            </div>

                            <span className="font-bold text-slate-600">
                              {punch.duration ? `${punch.duration}m` : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer: Aggregated Metrics */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Duration
                  </span>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-800">
                      {Math.floor(emp.totalMinutes / 60)}h {emp.totalMinutes % 60}m
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      ({emp.totalMinutes} mins)
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {groupedData.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-slate-600 font-medium text-base">No staff attendance records</h3>
                <p className="text-slate-400 text-sm mt-1">There are no punches found for the selected dates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
