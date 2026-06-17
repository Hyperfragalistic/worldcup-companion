import { useEffect, useState } from 'react'

export interface GeoLocationState {
  countryCode: string | null  // uppercase ISO 3166-1 alpha-2; 'GB-WLS' for Wales
  countryName: string | null
  loading: boolean
  error: string | null
}

export function useGeoLocation(): GeoLocationState {
  const [state, setState] = useState<GeoLocationState>({
    countryCode: null,
    countryName: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, loading: false, error: 'Geolocation not supported' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { 'Accept-Language': 'en-US' } },
          )
          if (!res.ok) throw new Error('Geocoding request failed')

          const data = await res.json()
          const address = data.address as Record<string, string> | undefined

          let code = address?.country_code?.toUpperCase() ?? null
          const name = address?.country ?? null

          // GB covers England, Wales, Scotland — distinguish Wales for the WC roster
          if (code === 'GB' && address?.state === 'Wales') code = 'GB-WLS'

          setState({ countryCode: code, countryName: name, loading: false, error: null })
        } catch {
          setState({ countryCode: null, countryName: null, loading: false, error: 'Reverse geocoding failed' })
        }
      },
      (posErr) => {
        const error =
          posErr.code === posErr.PERMISSION_DENIED    ? 'Location permission denied'   :
          posErr.code === posErr.POSITION_UNAVAILABLE ? 'Location unavailable'          :
                                                        'Location request timed out'
        setState({ countryCode: null, countryName: null, loading: false, error })
      },
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  return state
}
