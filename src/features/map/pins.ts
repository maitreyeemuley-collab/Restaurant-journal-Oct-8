import L from 'leaflet'
import type { PlaceStatus } from '../../data/types'

/** Pin colors match the status badges: terracotta = Want to try, olive = Visited. */
const COLORS: Record<PlaceStatus, string> = {
  want_to_try: '#b4472b',
  visited: '#5f7a3a',
}

export function pinIcon(status: PlaceStatus): L.DivIcon {
  return L.divIcon({
    className: 'rj-pin-wrapper',
    html: `<span class="rj-pin" style="--pin-color:${COLORS[status]}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  })
}
