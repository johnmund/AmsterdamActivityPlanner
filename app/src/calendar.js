export function createCalendarView(container, activities, view, selectedDay, onSelect, currentMonthDate, options = {}) {
  const { selectedBaseId = null, onSelectDay = null } = options;
  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long' });
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const title = document.createElement('h3');
  title.style.margin = '0 0 12px';
  title.style.fontSize = '18px';

  if (view === 'day') {
    title.textContent = `${monthName} ${selectedDay}`;
    container.appendChild(title);
    renderDayList(container, activities, selectedDay, onSelect);
    return;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Lay the month out as week rows (null = a blank padding cell).
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Week view shows only the week that contains the selected day.
  let weeksToRender = weeks;
  if (view === 'week') {
    const weekIndex = Math.floor((firstDay + (selectedDay - 1)) / 7);
    weeksToRender = [weeks[weekIndex] || weeks[0]];
    const wk = weeksToRender[0].filter(Boolean);
    title.textContent = `Week of ${monthName} ${wk[0]}–${wk[wk.length - 1]}`;
  } else {
    title.textContent = `${monthName} ${year}`;
  }
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(7, minmax(0, 1fr))';
  grid.style.gap = '8px';

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(label => {
    const cell = document.createElement('div');
    cell.textContent = label;
    cell.style.fontSize = '12px';
    cell.style.fontWeight = '700';
    cell.style.color = '#64748b';
    grid.appendChild(cell);
  });

  const maxTags = view === 'week' ? 6 : 3;
  const minHeight = view === 'week' ? '130px' : '92px';

  weeksToRender.forEach(week => {
    week.forEach(day => {
      if (day === null) {
        const empty = document.createElement('div');
        empty.style.minHeight = minHeight;
        grid.appendChild(empty);
        return;
      }

      const dayActivities = activities.filter(item => item.day === day);
      const isSelectedDay = day === selectedDay;
      const isOpenDay = selectedBaseId && dayActivities.some(a => a.baseId === selectedBaseId);

      const cell = document.createElement('button');
      cell.style.minHeight = minHeight;
      cell.style.border = isOpenDay ? '2px solid #2563eb' : '1px solid #e2e8f0';
      cell.style.borderRadius = '10px';
      cell.style.background = isSelectedDay ? '#162033' : (isOpenDay ? '#eff6ff' : '#ffffff');
      cell.style.color = isSelectedDay ? '#ffffff' : '#0f172a';
      cell.style.padding = '8px';
      cell.style.textAlign = 'left';
      cell.style.cursor = 'pointer';
      cell.style.display = 'flex';
      cell.style.flexDirection = 'column';
      cell.style.gap = '3px';
      cell.innerHTML = `<div style="font-size:12px;font-weight:700;">${day}</div>`;

      dayActivities.slice(0, maxTags).forEach(activity => {
        const isMatch = activity.baseId === selectedBaseId;
        const tag = document.createElement('div');
        tag.textContent = activity.title;
        tag.title = `${activity.title} · ${activity.location}`;
        tag.style.fontSize = '11px';
        tag.style.padding = '3px 5px';
        tag.style.background = isMatch ? '#2563eb' : (isSelectedDay ? '#2d3b56' : '#e8f0ff');
        tag.style.color = isMatch ? '#fff' : (isSelectedDay ? '#f8fafc' : '#1e3a8a');
        tag.style.borderRadius = '6px';
        tag.style.overflow = 'hidden';
        tag.style.textOverflow = 'ellipsis';
        tag.style.whiteSpace = 'nowrap';
        tag.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelect(activity, day);
        });
        cell.appendChild(tag);
      });

      if (dayActivities.length > maxTags) {
        const more = document.createElement('div');
        more.textContent = `+${dayActivities.length - maxTags} more`;
        more.style.fontSize = '10px';
        more.style.marginTop = '1px';
        more.style.color = isSelectedDay ? '#cbd5e1' : '#64748b';
        cell.appendChild(more);
      }

      // Clicking the cell itself (not a tag) opens the day summary.
      cell.addEventListener('click', () => {
        if (onSelectDay) onSelectDay(day);
        else if (dayActivities.length) onSelect(dayActivities[0], day);
      });
      grid.appendChild(cell);
    });
  });

  container.appendChild(grid);
}

function renderDayList(container, activities, selectedDay, onSelect) {
  const dayActivities = activities.filter(item => item.day === selectedDay);
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '8px';

  if (!dayActivities.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No events for this day in the current filter.';
    empty.style.color = '#64748b';
    empty.style.padding = '12px 0';
    list.appendChild(empty);
    container.appendChild(list);
    return;
  }

  dayActivities.forEach(activity => {
    const card = document.createElement('button');
    card.style.border = '1px solid #e2e8f0';
    card.style.borderRadius = '10px';
    card.style.background = '#fbfdff';
    card.style.padding = '10px 12px';
    card.style.textAlign = 'left';
    card.style.cursor = 'pointer';
    card.innerHTML = `<strong>${activity.title}</strong><div style="color:#64748b;font-size:13px;margin-top:4px;">${activity.dateLabel} · ${activity.location}</div>`;
    card.addEventListener('click', () => onSelect(activity, selectedDay));
    list.appendChild(card);
  });

  container.appendChild(list);
}
