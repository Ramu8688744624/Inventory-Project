import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { shopConfig } from '../services/shopConfig'

const PATH_TO_TITLE = {
  '/': 'Dashboard',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/sales-pos': 'Sales POS',
  '/stock': 'Stock',
  '/out-of-stock': 'Out of Stock',
  '/low-stock': 'Low Stock',
  '/sales-history': 'Sales History',
  '/profit-reports': 'Profit Reports',
  '/service-income': 'Service Income',
  '/settings': 'Settings',
}

export default function PageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = PATH_TO_TITLE[pathname] || 'Inventory'
    document.title = `${shopConfig.name} - ${title}`
    return () => {
      document.title = shopConfig.name
    }
  }, [pathname])

  return null
}
