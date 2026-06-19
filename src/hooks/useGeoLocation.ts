import { useEffect, useState } from 'react'

export interface GeoLocationState {
  countryCode: string | null  // uppercase ISO 3166-1 alpha-2; 'GB-WLS' for Wales
  countryName: string | null
  timezone:    string | null  // IANA tz id, e.g. 'America/New_York'
  loading: boolean
  error: string | null
}

export function useGeoLocation(): GeoLocationState {
  const [state, setState] = useState<GeoLocationState>({
    countryCode: null,
    countryName: null,
    timezone:    null,
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
        const { latitude: lat, longitude: lon } = coords
        try {
          // Run country lookup and timezone lookup in parallel
          const [geoRes, tzRes] = await Promise.allSettled([
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
              { headers: { 'Accept-Language': 'en-US' } },
            ),
            fetch(
              `https://timeapi.io/api/time/current/coordinate?latitude=${lat}&longitude=${lon}`,
            ),
          ])

          let code: string | null = null
          let name: string | null = null
          let timezone: string | null = null

          if (geoRes.status === 'fulfilled' && geoRes.value.ok) {
            const data = await geoRes.value.json()
            const address = data.address as Record<string, string> | undefined
            code = address?.country_code?.toUpperCase() ?? null
            name = address?.country ?? null
            if (code === 'GB' && address?.state === 'Wales') code = 'GB-WLS'
          }

          if (tzRes.status === 'fulfilled' && tzRes.value.ok) {
            const tzData = await tzRes.value.json()
            timezone = tzData.timeZone ?? null
          }

          setState({ countryCode: code, countryName: name, timezone, loading: false, error: null })
        } catch {
          setState({ countryCode: null, countryName: null, timezone: null, loading: false, error: 'Reverse geocoding failed' })
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
