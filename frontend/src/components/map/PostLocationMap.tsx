import { useEffect, useMemo } from 'react'

import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type PostLocationMapProps = {
  latitude: number | string
  longitude: number | string
  title?: string
  address?: string
  className?: string
  height?: number
}

const mapTileAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const isValidCoordinate = (latitude: number, longitude: number) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

const PostLocationMap = ({
  latitude,
  longitude,
  title = 'Vi tri phong tro',
  address,
  className,
  height = 360
}: PostLocationMapProps) => {
  const lat = Number(latitude)
  const lng = Number(longitude)

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: 'post-location-marker',
        html: '<span class="post-location-marker-dot"></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      }),
    []
  )

  if (!isValidCoordinate(lat, lng)) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 ${className ?? ''}`}
        style={{ height }}
      >
        Bai dang chua co toa do hop le de hien thi ban do.
      </div>
    )
  }

  const center: [number, number] = [lat, lng]
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm ${className ?? ''}`}>
      <MapContainer center={center} zoom={16} scrollWheelZoom={false} style={{ height, width: '100%' }}>
        <RecenterMap center={center} />
        <TileLayer attribution={mapTileAttribution} url='https://tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <Marker position={center} icon={markerIcon}>
          <Popup>
            <div className='space-y-1'>
              <p className='font-semibold'>{title}</p>
              {address ? <p className='text-sm text-gray-600'>{address}</p> : null}
              <a href={googleMapsUrl} target='_blank' rel='noreferrer' className='text-sm text-blue-600 underline'>
                Mo trong Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default PostLocationMap
