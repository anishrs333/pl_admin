import { WifiOff, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  if (online) return null

  return (
    <div className="state-offline-banner">
      <WifiOff size={16} />
      <span>You're offline. Check your internet connection.</span>
      <button className="btn btn-sm btn-secondary" onClick={() => window.location.reload()}>
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  )
}
