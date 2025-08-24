import { useState, useEffect } from 'react';

export default function DateRangeSelector({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onDownload,
  downloadDisabled = false,
  downloadCount = 0,
  className = "" 
}) {
  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  useEffect(() => {
    validateDates();
  }, [startDate, endDate]);

  const validateDates = () => {
    const newErrors = {};

    // Validate start date
    if (startDate && endDate && startDate > endDate) {
      newErrors.startDate = 'Start date cannot be after end date';
    }

    // Validate end date
    if (endDate && endDate > today) {
      newErrors.endDate = 'End date cannot be in the future';
    }

    setErrors(newErrors);
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    onStartDateChange(newStartDate);
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    onEndDateChange(newEndDate);
  };

  const clearDates = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  const setToday = () => {
    onStartDateChange(today);
    onEndDateChange(today);
  };

  const setLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    onStartDateChange(lastWeek.toISOString().split('T')[0]);
    onEndDateChange(today);
  };

  const setLastMonth = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    onStartDateChange(lastMonth.toISOString().split('T')[0]);
    onEndDateChange(today);
  };

  const hasErrors = Object.keys(errors).length > 0;
  const hasDates = startDate || endDate;

  // Determine which quick filter is active
  const isTodayActive = startDate === today && endDate === today;
  const isLastWeekActive = startDate === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === today;
  const isLastMonthActive = startDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && endDate === today;

  return (
    <div className={`bg-white rounded-lg shadow p-3 sm:p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 w-full">
          <div className="w-full sm:flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || today}
              className={`border rounded-md px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full ${
                errors.startDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.startDate && (
              <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
            )}
          </div>
          
          <div className="w-full sm:flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate}
              max={today}
              className={`border rounded-md px-3 py-2 h-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full ${
                errors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.endDate && (
              <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Quick Actions and Download */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={setToday}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 h-10 text-xs sm:text-sm rounded-md transition-colors border ${
                isTodayActive
                  ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={setLastWeek}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 h-10 text-xs sm:text-sm rounded-md transition-colors border ${
                isLastWeekActive
                  ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">Last Week</span>
              <span className="sm:hidden">Week</span>
            </button>
            <button
              onClick={setLastMonth}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 h-10 text-xs sm:text-sm rounded-md transition-colors border ${
                isLastMonthActive
                  ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">Last Month</span>
              <span className="sm:hidden">Month</span>
            </button>
          </div>
          
          {hasDates && (
            <button
              onClick={clearDates}
              className="w-full sm:w-auto px-3 py-2 h-10 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={onDownload}
          disabled={downloadDisabled}
          className="w-full sm:w-auto bg-green-600 text-white px-3 sm:px-6 py-3 h-10 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 font-medium transition-colors text-xs sm:text-sm"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Download CSV ({downloadCount} orders)</span>
          <span className="sm:hidden">Download ({downloadCount})</span>
        </button>
      </div>



      {/* Error Summary */}
      {hasErrors && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium mb-1">Please fix the following errors:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
