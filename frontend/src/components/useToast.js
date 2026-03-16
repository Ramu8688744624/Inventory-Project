import { useOutletContext } from 'react-router-dom'

export function useToast() {
  const ctx = useOutletContext()
  return ctx?.setToast || (() => {})
}

