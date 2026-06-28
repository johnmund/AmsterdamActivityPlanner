export function createCalendarView(container, activities, view, selectedDay, onSelect) {
  const title = document.createElement('h3');
  title.textContent = view === 'month' ? 'July 2026' : view === 'week' ? 'Week of 1–7 July' : `July ${selectedDay}`;
  title.style.margin = '0 0 12px';
  title.style.fontSize = '18px';
  container.appendChild(title);

  if (view === 'day') {
    const dayActivities = activities.filter(item => item.day === selectedDay);
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    if (!dayActivities.length) {
      const empty = document.createElement('div');
      empty.textContent = 'No activities for this day in the current filter.';
      empty.style.color = '#64748b';
      empty.style.padding = '12px 0';
      list.appendChild(empty);
      container.appendChild(list);
      return;
    }

    dayActivities.forEach(activity => {
      const card = document.createElement('button');
      card.style.border = activity.category === 'walking-tour' ? '1px solid #bfdbfe' : '1px solid #e2e8f0';
      card.style.borderRadius = '10px';
      card.style.background = activity.category === 'walking-tour' ? '#f0f7ff' : '#fbfdff';
      card.style.padding = '10px 12px';
      card.style.textAlign = 'left';
      card.style.cursor = 'pointer';
      card.innerHTML = `<strong>${activity.title}</strong><div style="color:#64748b;font-size:13px;margin-top:4px;">${activity.dateLabel} · ${activity.location}</div>${activity.category === 'walking-tour' ? '<div style="color:#2563eb;font-size:12px;margin-top:6px;">Walking route</div>' : ''}`;
      card.addEventListener('click', () => onSelect(activity, selectedDay));
      list.appendChild(card);
    });

    container.appendChild(list);
    return;
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(7, minmax(0, 1fr))';
  grid.style.gap = '8px';

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayLabels.forEach(label => {
    const cell = document.createElement('div');
    cell.textContent = label;
    cell.style.fontSize = '12px';
    cell.style.fontWeight = '700';
    cell.style.color = '#64748b';
    grid.appendChild(cell);
  });

  for (let day = 1; day <= 31; day += 1) {
    const cell = document.createElement('button');
    cell.style.minHeight = view === 'week' ? '92px' : '78px';
    cell.style.border = '1px solid #e2e8f0';
    cell.style.borderRadius = '10px';
    cell.style.background = day === selectedDay ? '#162033' : '#ffffff';
    cell.style.color = day === selectedDay ? '#ffffff' : '#0f172a';
    cell.style.padding = '8px';
    cell.style.textAlign = 'left';
    cell.style.cursor = 'pointer';
    cell.innerHTML = `<div style="font-size:12px;font-weight:700;">${day}</div>`;

    const dayActivities = activities.filter(item => item.day === day);
    if (dayActivities.length) {
      const tags = document.createElement('div');
      tags.style.marginTop = '6px';
      tags.style.display = 'flex';
      tags.style.flexDirection = 'column';
      tags.style.gap = '4px';
      dayActivities.slice(0, view === 'week' ? 2 : 1).forEach(activity => {
        const tag = document.createElement('div');
        tag.textContent = activity.title;
        tag.style.fontSize = '11px';
        tag.style.padding = '3px 5px';
        tag.style.background = day === selectedDay ? '#2d3b56' : '#e8f0ff';
        tag.style.color = day === selectedDay ? '#f8fafc' : '#1e3a8a';
        tag.style.borderRadius = '6px';
        tag.style.overflow = 'hidden';
        tag.style.textOverflow = 'ellipsis';
        tag.style.whiteSpace = 'nowrap';
        tag.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelect(activity, day);
        });
        tags.appendChild(tag);
      });
      cell.appendChild(tags);
    }

    cell.addEventListener('click', () => onSelect(dayActivities[0], day));
    grid.appendChild(cell);
  }

  container.appendChild(grid);
}
