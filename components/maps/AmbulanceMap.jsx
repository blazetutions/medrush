'use client';
import { useEffect, useRef } from 'react';

const STATUS_COLOR = {
  available:   '#16a34a',
  on_call:     '#d97706',
  maintenance: '#dc2626',
  offline:     '#94a3b8',
};

export function AmbulanceMap({ units = [], hospitals = [], height = '420px', onSelectUnit, onSelectHospital }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !divRef.current) return;

    import('leaflet').then(mod => {
      const L = mod.default;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) {
        mapRef.current = L.map(divRef.current, { zoomControl: true }).setView([9.9252, 78.1198], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap', maxZoom: 19,
        }).addTo(mapRef.current);
      }

      // Clear existing markers
      mapRef.current.eachLayer(layer => {
        if (layer._icon || layer._latlng) layer.remove();
      });

      // Ambulance markers
      (units || []).forEach(u => {
        if (!u.current_lat || !u.current_lng) return;
        const color = STATUS_COLOR[u.status] ?? '#64748b';
        const icon = L.divIcon({
          html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;">🚑</div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 18],
        });
        const marker = L.marker([u.current_lat, u.current_lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="min-width:180px;font-family:Arial,sans-serif">
              <b style="font-size:14px">${u.unit_code}</b>
              <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:12px;font-size:11px;background:${color}22;color:${color};font-weight:600">${(u.status || '').replace('_', ' ').toUpperCase()}</span>
              <div style="margin-top:8px;font-size:12px;color:#475569">
                <div>🏥 <b>Type:</b> ${u.type}</div>
                <div>👨‍⚕️ ${u.paramedic_name}</div>
                <div>🚗 ${u.driver_name} · ${u.vehicle_no}</div>
                <div>📍 ${u.zone}</div>
                <div>⏱ ETA: <b>${u.eta_minutes ?? 10} min</b></div>
              </div>
              ${(u.facilities || []).length > 0
                ? `<div style="margin-top:8px;font-size:11px;color:#64748b"><b>Facilities:</b> ${(u.facilities || []).slice(0, 3).join(', ')}${(u.facilities || []).length > 3 ? '…' : ''}</div>`
                : ''}
            </div>
          `);
        if (onSelectUnit) marker.on('click', () => onSelectUnit(u));
      });

      // Hospital markers
      (hospitals || []).forEach(h => {
        if (!h.lat || !h.lng) return;
        const shortName = h.name.length > 20 ? h.name.substring(0, 18) + '…' : h.name;
        const icon = L.divIcon({
          html: `<div style="background:#0B1F3A;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #0D9488;">🏥 ${shortName}</div>`,
          className: '', iconAnchor: [60, 20],
        });
        const marker = L.marker([h.lat, h.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="min-width:200px;font-family:Arial,sans-serif">
              <b style="font-size:13px">${h.name}</b>
              <div style="margin-top:6px;font-size:12px;color:#475569">
                <div>⭐ ${h.rating} · MedRush Score: ${h.medrush_score ?? '-'}/100</div>
                <div>🛏 ${h.beds} beds · ${h.nabh_certified ? '✅ NABH' : 'NABH pending'}</div>
                <div>📞 ${h.phone}</div>
              </div>
            </div>
          `);
        if (onSelectHospital) marker.on('click', () => onSelectHospital(h));
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [units, hospitals]);

  return (
    <div
      ref={divRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}
    />
  );
}
