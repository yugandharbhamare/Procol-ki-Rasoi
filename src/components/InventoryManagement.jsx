import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { inventoryService } from '../services/inventoryService'
import { useStaffAuth } from '../contexts/StaffAuthContext'
import SimplePagination from './SimplePagination'
import { ChevronLeftIcon, XMarkIcon, PencilIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const COMMON_UOMS = ['pcs', 'kg', 'g', 'litre', 'ml', 'bottle', 'can', 'dozen', 'pkt', 'box', 'bag', 'cup', 'plate', 'serve']

const emptyForm = { item_name: '', available_quantity: '', uom: 'pcs' }

// ─── InventoryModal ───────────────────────────────────────────────────────────
function InventoryModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        available_quantity: item.available_quantity?.toString() || '',
        uom: item.uom || 'pcs'
      })
    } else {
      setFormData(emptyForm)
    }
    setErrors({})
  }, [item])

  const validate = () => {
    const errs = {}
    if (!formData.item_name.trim()) errs.item_name = 'Item name is required'
    if (formData.available_quantity === '') {
      errs.available_quantity = 'Quantity is required'
    } else if (!Number.isInteger(Number(formData.available_quantity)) || Number(formData.available_quantity) < 0) {
      errs.available_quantity = 'Enter a valid whole number'
    }
    if (!formData.uom.trim()) errs.uom = 'UOM is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {item && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-mono text-gray-600">
                  {item.item_code}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="e.g. Milk"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.item_name ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.item_name && <p className="mt-1 text-sm text-red-600">{errors.item_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity *</label>
                <input
                  type="number"
                  name="available_quantity"
                  value={formData.available_quantity}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.available_quantity ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.available_quantity && <p className="mt-1 text-sm text-red-600">{errors.available_quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
                <select
                  name="uom"
                  value={formData.uom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.uom ? 'border-red-300' : 'border-gray-300'}`}
                >
                  {COMMON_UOMS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.uom && <p className="mt-1 text-sm text-red-600">{errors.uom}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── BookInwardModal ──────────────────────────────────────────────────────────
function BookInwardModal({ inventoryItems, staffUserName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ inventory_item_id: '', quantity: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const validate = () => {
    const errs = {}
    if (!formData.inventory_item_id) errs.inventory_item_id = 'Please select an item'
    if (formData.quantity === '') {
      errs.quantity = 'Quantity is required'
    } else if (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Enter a valid whole number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSaveError(null)
    const result = await inventoryService.bookInward(
      parseInt(formData.inventory_item_id),
      formData.quantity,
      null,
      staffUserName
    )
    setSaving(false)
    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setSaveError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Book Inward</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
              <select
                name="inventory_item_id"
                value={formData.inventory_item_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.inventory_item_id ? 'border-red-300' : 'border-gray-300'}`}
              >
                <option value="">— Select an item —</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_code} — {item.item_name} (current: {parseFloat(item.available_quantity) % 1 === 0 ? parseInt(item.available_quantity) : parseFloat(item.available_quantity).toFixed(2)} {item.uom})
                  </option>
                ))}
              </select>
              {errors.inventory_item_id && <p className="mt-1 text-sm text-red-600">{errors.inventory_item_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="e.g. 10"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.quantity ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Booking...' : 'Book Inward'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Ledger transaction type config ──────────────────────────────────────────
const TX_TYPE_CONFIG = {
  inward:             { label: 'Inward',             classes: 'bg-green-100 text-green-800' },
  order_deduction:    { label: 'Order Placed',        classes: 'bg-red-100 text-red-800' },
  manual_adjustment:  { label: 'Manual Adjustment',  classes: 'bg-amber-100 text-amber-800' },
  order_restoration:  { label: 'Order Cancelled',    classes: 'bg-blue-100 text-blue-800' },
}

const LEDGER_PAGE_SIZE = 20

// ─── ItemLedgerTab ────────────────────────────────────────────────────────────
function ItemLedgerTab({ onStockRefresh, refreshKey }) {
  const [entries, setEntries]           = useState([])
  const [totalCount, setTotalCount]     = useState(0)
  const [ledgerLoading, setLedgerLoading] = useState(true)
  const [ledgerError, setLedgerError]   = useState(null)
  const [currentPage, setCurrentPage]   = useState(1)

  // Filters
  const [search, setSearch]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('')

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true)
    setLedgerError(null)
    const result = await inventoryService.getLedgerEntries({
      search:           search.trim() || undefined,
      transaction_type: txTypeFilter  || undefined,
      dateFrom:         dateFrom      || undefined,
      dateTo:           dateTo        || undefined,
      page:             currentPage,
      pageSize:         LEDGER_PAGE_SIZE
    })
    if (result.success) {
      setEntries(result.entries)
      setTotalCount(result.count)
    } else {
      setLedgerError(result.error)
    }
    setLedgerLoading(false)
  }, [search, txTypeFilter, dateFrom, dateTo, currentPage, refreshKey])

  useEffect(() => { fetchLedger() }, [fetchLedger])

  // Reset to page 1 when any filter changes
  useEffect(() => { setCurrentPage(1) }, [search, txTypeFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(totalCount / LEDGER_PAGE_SIZE))

  const formatDateTime = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const fmtQty = (n) => {
    const v = parseFloat(n)
    return v % 1 === 0 ? parseInt(v) : v.toFixed(2)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search item code or name..."
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-gray-600"
            />
          </div>

          {/* Date To */}
          <div>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-gray-600"
            />
          </div>

          {/* Transaction type */}
          <div>
            <select
              value={txTypeFilter}
              onChange={e => setTxTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-gray-600"
            >
              <option value="">All Types</option>
              <option value="inward">Inward</option>
              <option value="order_deduction">Order Placed</option>
              <option value="manual_adjustment">Manual Adjustment</option>
              <option value="order_restoration">Order Cancelled</option>
            </select>
          </div>
        </div>

        {/* Active filters + clear */}
        {(search || dateFrom || dateTo || txTypeFilter) && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">Filters active</span>
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setTxTypeFilter('') }}
              className="text-xs text-orange-600 hover:text-orange-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {ledgerError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start">
          <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="ml-3 text-sm text-red-700">{ledgerError}</p>
          <button onClick={() => setLedgerError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {ledgerLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading ledger...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No ledger entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {(search || dateFrom || dateTo || txTypeFilter)
                ? 'Try adjusting your filters.'
                : 'Transactions will appear here as stock moves in and out.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Item Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Qty Change</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Before</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">After</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map(entry => {
                    const txCfg = TX_TYPE_CONFIG[entry.transaction_type] || { label: entry.transaction_type, classes: 'bg-gray-100 text-gray-700' }
                    const change = parseFloat(entry.quantity_change)
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700">
                            {entry.item_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {entry.item_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${txCfg.classes}`}>
                            {txCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${change > 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {change > 0 ? '+' : ''}{fmtQty(change)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                          {fmtQty(entry.quantity_before)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-700 font-medium">
                          {fmtQty(entry.quantity_after)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {entry.reference_id
                            ? <span className="font-mono text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{entry.reference_id}</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px]">
                          {entry.notes
                            ? <span title={entry.notes} className="block truncate">{entry.notes}</span>
                            : <span className="text-gray-400">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {entry.created_by || <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * LEDGER_PAGE_SIZE + 1}–{Math.min(currentPage * LEDGER_PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}

// ─── InventoryManagement (main) ───────────────────────────────────────────────
const InventoryManagement = () => {
  const navigate = useNavigate()
  const { staffUser } = useStaffAuth()
  const staffUserName = staffUser?.displayName || staffUser?.name || null

  const [activeTab, setActiveTab] = useState('stock')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockPage, setStockPage] = useState(1)
  const [showInward, setShowInward] = useState(false)
  const [ledgerRefreshKey, setLedgerRefreshKey] = useState(0)
  const STOCK_PAGE_SIZE = 10

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await inventoryService.getAllInventoryItems()
    if (result.success) {
      setItems(result.items)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    if (!term) return items
    return items.filter(i =>
      i.item_code.toLowerCase().includes(term) ||
      i.item_name.toLowerCase().includes(term)
    )
  }, [items, searchTerm])

  // Reset to page 1 when search changes
  useEffect(() => { setStockPage(1) }, [searchTerm])

  const stockTotalPages = Math.ceil(filtered.length / STOCK_PAGE_SIZE)
  const paginatedStock = useMemo(() => {
    const start = (stockPage - 1) * STOCK_PAGE_SIZE
    return filtered.slice(start, start + STOCK_PAGE_SIZE)
  }, [filtered, stockPage])

  const handleSave = async (formData) => {
    if (editingItem) {
      // Capture before-qty for ledger logging
      const qtyBefore = parseFloat(editingItem.available_quantity) || 0
      const qtyAfter  = parseFloat(formData.available_quantity) || 0

      const result = await inventoryService.updateInventoryItem(editingItem.id, formData)
      if (result.success) {
        setItems(prev => prev.map(i => i.id === editingItem.id ? result.item : i))
        setShowModal(false)
        setEditingItem(null)

        // Log every edit as a manual_adjustment entry in the ledger (non-fatal)
        inventoryService.addManualAdjustmentLog(
          editingItem.id, qtyBefore, qtyAfter, staffUserName
        ).catch(err => console.warn('Manual adjustment log failed (non-fatal):', err))
      } else {
        setError(result.error)
      }
    } else {
      const result = await inventoryService.addInventoryItem(formData)
      if (result.success) {
        setItems(prev => [result.item, ...prev])
        setShowModal(false)
      } else {
        setError(result.error)
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const result = await inventoryService.deleteInventoryItem(deleteConfirm.id)
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } else {
      setError(result.error)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/staff/')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
              <p className="hidden sm:block text-sm text-gray-500">Manage stock levels for items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'stock',  label: 'Stock' },
              { key: 'ledger', label: 'Item Ledger' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start">
              <XMarkIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search + Actions */}
          <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code or name..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowInward(true)}
                className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Book Inward</span>
              </button>
              <button
                onClick={() => { setEditingItem(null); setShowModal(true) }}
                className="flex items-center space-x-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  {items.length === 0 ? 'No inventory items yet' : 'No items match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {items.length === 0 ? 'Add your first item to get started.' : 'Try a different search term.'}
                </p>
                {items.length === 0 && (
                  <button
                    onClick={() => { setEditingItem(null); setShowModal(true) }}
                    className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Item
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700">
                            {item.item_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            parseFloat(item.available_quantity) <= 0
                              ? 'text-red-600'
                              : parseFloat(item.available_quantity) <= 5
                              ? 'text-amber-600'
                              : 'text-green-700'
                          }`}>
                            {parseFloat(item.available_quantity) % 1 === 0
                              ? parseInt(item.available_quantity)
                              : parseFloat(item.available_quantity).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.uom}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.last_updated_on)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => { setEditingItem(item); setShowModal(true) }}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {stockTotalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Showing {(stockPage - 1) * STOCK_PAGE_SIZE + 1}–{Math.min(stockPage * STOCK_PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <SimplePagination
                  currentPage={stockPage}
                  totalPages={stockTotalPages}
                  onPageChange={setStockPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <ItemLedgerTab
          onStockRefresh={loadItems}
          refreshKey={ledgerRefreshKey}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <InventoryModal
          item={editingItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingItem(null) }}
        />
      )}

      {/* Book Inward Modal */}
      {showInward && (
        <BookInwardModal
          inventoryItems={items}
          staffUserName={staffUserName}
          onClose={() => setShowInward(false)}
          onSuccess={() => {
            loadItems()
            setLedgerRefreshKey(k => k + 1)
          }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Delete Inventory Item</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.item_name}</strong> ({deleteConfirm.item_code})?
              This will also unlink any menu items using this inventory entry.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement
