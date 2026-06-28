export function createMapView(container, activities, selectedActivity) {
  const map = document.createElement('div');
  map.style.height = '100%';
  map.style.width = '100%';
  map.style.background = 'linear-gradient(135deg, #e0f2fe, #f8fafc)';
  map.style.display = 'flex';
  map.style.flexDirection = 'column';
  map.style.color = '#0f172a';
  map.style.overflow = 'hidden';

  if (selectedActivity) {
    const iframe = document.createElement('iframe');
    const path = selectedActivity.path ? selectedActivity.path.map(point => `${point.lat},${point.lng}`).join('&marker=') : null;
    const routeQuery = selectedActivity.category === 'walking-tour' || selectedActivity.category === 'route' || selectedActivity.category === 'brewery'
      ? `${path ? `&marker=${path}` : `&marker=${selectedActivity.lat}%2C${selectedActivity.lng}`}`
      : `&marker=${selectedActivity.lat}%2C${selectedActivity.lng}`;
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${selectedActivity.lng - 0.03}%2C${selectedActivity.lat - 0.02}%2C${selectedActivity.lng + 0.03}%2C${selectedActivity.lat + 0.02}${routeQuery}&layer=mapnik`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.setAttribute('loading', 'lazy');
    map.appendChild(iframe);
  } else {
    map.style.alignItems = 'center';
    map.style.justifyContent = 'center';
    map.style.padding = '16px';
    map.innerHTML = `
      <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Map preview</div>
      <div style="font-size:14px;color:#475569;text-align:center;">${activities.length} activities loaded</div>
      <div style="margin-top:10px;font-size:13px;color:#334155;">Select an activity to see the location.</div>
    `;
  }

  container.innerHTML = '';
  container.appendChild(map);
}
