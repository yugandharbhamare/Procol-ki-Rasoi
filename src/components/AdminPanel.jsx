import { useState, useEffect } from 'react'
import { getPendingOrders, markOrderAsSynced, clearPendingOrders, fetchOrdersFromGoogleSheets } from '../services/googleSheetsService'
import { useOrders } from '../contexts/OrderContext'

// Remove the entire AdminPanel component as manual sync is no longer needed
export default function AdminPanel() {
  return null;
} 