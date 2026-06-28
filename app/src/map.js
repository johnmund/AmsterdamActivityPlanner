const categoryColors = {
  highlight: '#e11d48',
  park: '#0d9488',
  route: '#059669',
  market: '#2563eb',
  concert: '#7c3aed',
  event: '#dc2626',
  museum: '#9333ea',
  'walking-tour': '#16a34a',
  restaurant: '#ea580c',
  sandwich: '#d97706',
  coffeeshop: '#78350f',
  brewery: '#b45309',
  grocery: '#65a30d'
};

let mapInstance = null;
let markerGroup = null;

export function createMapView(container, activities, selectedActivity, onSelect) {
  if (typeof L === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">Map loading…</div>';
    return;
  }

  if (!mapInstance) {
    container.innerHTML = '';
    mapInstance = L.map(container, { scrollWheelZoom: false }).setView([52.3676, 4.9041], 13);
    // CartoDB Positron: a clean, light basemap without colored transit/road lines
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance);
    markerGroup = L.featureGroup().addTo(mapInstance);
  }

  markerGroup.clearLayers();

  const seen = new Map();
  activities.forEach(a => {
    if (a.lat && a.lng) {
      const key = `${a.lat.toFixed(4)},${a.lng.toFixed(4)}`;
      if (!seen.has(key)) seen.set(key, a);
    }
  });

  seen.forEach(activity => {
    const color = categoryColors[activity.category] || '#64748b';
    const isSelected = selectedActivity &&
      Math.abs(activity.lat - selectedActivity.lat) < 0.0005 &&
      Math.abs(activity.lng - selectedActivity.lng) < 0.0005;

    const marker = L.circleMarker([activity.lat, activity.lng], {
      radius: isSelected ? 12 : 7,
      fillColor: color,
      color: isSelected ? '#162033' : '#fff',
      weight: isSelected ? 3 : 2,
      fillOpacity: isSelected ? 1 : 0.85
    });

    marker.bindPopup(`<b>${activity.title}</b><br><span style="color:#64748b;font-size:12px">${activity.location}</span>`);
    marker.on('click', () => { if (onSelect) onSelect(activity); });
    markerGroup.addLayer(marker);
  });

  const hasPath = selectedActivity && Array.isArray(selectedActivity.path) && selectedActivity.path.length > 1;

  if (hasPath) {
    // Draw an approximate route line so walking/cycling routes read as a
    // connected path rather than a single dot. Geometry is indicative, not exact —
    // the precise turn-by-turn lives behind the "Follow full route" Google Maps link.
    const color = categoryColors[selectedActivity.category] || '#0f766e';
    const latlngs = selectedActivity.path.map(p => [p.lat, p.lng]);
    const line = L.polyline(latlngs, {
      color,
      weight: 4,
      opacity: 0.85,
      dashArray: '2,7',
      lineCap: 'round',
      lineJoin: 'round'
    });
    markerGroup.addLayer(line);
    selectedActivity.path.forEach(p => {
      markerGroup.addLayer(L.circleMarker([p.lat, p.lng], {
        radius: 4, fillColor: '#fff', color, weight: 2, fillOpacity: 1
      }));
    });
    mapInstance.fitBounds(line.getBounds().pad(0.2), { animate: true });
  } else if (selectedActivity && selectedActivity.lat) {
    // Pan to the selection without zooming in aggressively. Only ease the zoom
    // up to a comfortable city level if we're currently zoomed way out.
    const targetZoom = Math.max(mapInstance.getZoom(), 13);
    mapInstance.setView([selectedActivity.lat, selectedActivity.lng], targetZoom, { animate: true });
  } else if (markerGroup.getLayers().length) {
    mapInstance.fitBounds(markerGroup.getBounds().pad(0.1));
  }

  setTimeout(() => mapInstance.invalidateSize(), 50);
}
