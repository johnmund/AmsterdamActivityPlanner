import { createCalendarView } from './calendar.js';
import { createMapView } from './map.js';
import { loadMonthContent } from './dataLoader.js';
import { contentSources } from './contentSources.js';

const exploreCategoryLabels = {
  all: 'All',
  highlight: 'Highlights',
  park: 'Parks',
  route: 'Routes',
  market: 'Markets',
  concert: 'Concerts',
  event: 'Events',
  museum: 'Museums',
  'walking-tour': 'Walking tours'
};

const foodCategoryLabels = {
  restaurant: 'Restaurants',
  sandwich: 'Sandwiches',
  coffeeshop: 'Coffee shops',
  brewery: 'Breweries'
};

const eventCategories = ['market', 'concert', 'event'];
const nonCalendarCategories = ['highlight', 'park', 'route', 'walking-tour', 'brewery', 'restaurant', 'sandwich', 'coffeeshop', 'museum'];
const foodDrinkCategories = ['restaurant', 'sandwich', 'coffeeshop', 'brewery'];
// Categories that benefit from "research before you go" review links.
const researchCategories = [...foodDrinkCategories, 'museum', 'highlight', 'park'];

export function createApp(root) {
  const state = {
    selectedCategory: 'all',
    selectedActivityId: null,
    detailsMode: 'activity', // 'activity' | 'day'
    view: 'month',
    selectedDay: 1,
    monthOffset: 0,
    monthData: null,
    loading: true
  };

  root.innerHTML = `
    <div style="max-width:1400px;margin:0 auto;padding:16px 24px;">
      <h1 style="margin:0 0 4px;font-size:28px;">Amsterdam activities</h1>
      <p style="margin:0 0 12px;color:#4d5870;">Walking tours, breweries, markets, concerts, museums, and more.</p>

      <div id="explore-filters" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;"></div>
      <div id="food-filters" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;"></div>

      <div id="loading-bar" class="loading-pulse" style="padding:10px 14px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:14px;font-size:13px;color:#92400e;">
        Loading activities…
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="background:#fff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 4px 12px rgba(15,23,42,0.04);">
            <h2 style="margin:0 0 8px;font-size:18px;">Activities</h2>
            <div id="activity-list" style="display:flex;flex-direction:column;gap:6px;max-height:380px;overflow-y:auto;"></div>
          </div>
          <div id="calendar-section" style="margin-top:14px;">
            <div id="calendar-controls" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
              <div style="display:flex;gap:6px;">
                <button data-view="month" class="view-button active">Month</button>
                <button data-view="week" class="view-button">Week</button>
                <button data-view="day" class="view-button">Day</button>
              </div>
              <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
                <button id="month-back" style="border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;">&#8592;</button>
                <div id="month-label" style="font-weight:700;min-width:120px;text-align:center;"></div>
                <button id="month-forward" style="border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;">&#8594;</button>
              </div>
            </div>
            <div id="calendar" style="background:#fff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 4px 12px rgba(15,23,42,0.04);"></div>
          </div>
        </div>
        <div>
          <div id="map" style="height:440px;border-radius:12px;overflow:hidden;border:1px solid #e7ebf2;position:relative;z-index:0;"></div>
          <div id="details" style="margin-top:14px;border:1px solid #e7ebf2;border-radius:12px;padding:16px;background:#fbfcff;"></div>
        </div>
      </div>

      <div style="margin-top:18px;background:#fff;border:1px solid #e7ebf2;border-radius:16px;padding:16px;box-shadow:0 4px 12px rgba(15,23,42,0.04);">
        <h3 style="margin:0 0 8px;font-size:16px;">Public content sources</h3>
        <div style="font-size:13px;color:#64748b;">Events: ${contentSources.events.join(', ')}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Routes: ${contentSources.routes.join(', ')}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Food &amp; Drink: ${contentSources.foodAndDrink.join(', ')}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Museums: ${contentSources.museums.join(', ')}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Highlights: ${contentSources.highlights.join(', ')}</div>
      </div>
    </div>
  `;

  const viewButtons = root.querySelectorAll('.view-button');
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      viewButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      state.view = button.dataset.view;
      render();
    });
  });

  root.querySelector('#month-back').addEventListener('click', () => {
    state.monthOffset -= 1;
    state.selectedActivityId = null;
    state.detailsMode = 'activity';
    loadData();
  });

  root.querySelector('#month-forward').addEventListener('click', () => {
    state.monthOffset += 1;
    state.selectedActivityId = null;
    state.detailsMode = 'activity';
    loadData();
  });

  loadData();

  async function loadData() {
    state.loading = true;
    render();
    state.monthData = await loadMonthContent(getMonthKey(state.monthOffset));
    state.loading = false;
    render();
  }

  function render() {
    const monthData = state.monthData || { events: [], routes: [] };
    const mergedActivities = [...monthData.events, ...monthData.routes];
    const currentMonthDate = getMonthDate(state.monthOffset);

    // Unique, un-expanded items drive the list and the map (one entry per place).
    const filteredActivities = getFilteredActivities(mergedActivities);
    const uniqueActivities = filteredActivities
      .slice()
      .sort((a, b) => (a.day - b.day) || a.title.localeCompare(b.title));

    // The calendar gets the recurring items expanded into one entry per day.
    const calendarEvents = expandRecurringActivities(
      filteredActivities.filter(item => eventCategories.includes(item.category)),
      currentMonthDate
    );
    const showCalendar = state.selectedCategory === 'all' || eventCategories.includes(state.selectedCategory);

    const loadingBar = root.querySelector('#loading-bar');
    loadingBar.style.display = state.loading ? 'block' : 'none';

    renderFilters();

    const dayMode = state.detailsMode === 'day' && showCalendar;

    const calendarSection = root.querySelector('#calendar-section');
    calendarSection.style.display = showCalendar ? 'block' : 'none';
    if (showCalendar) {
      const calendarEl = root.querySelector('#calendar');
      calendarEl.innerHTML = '';
      createCalendarView(calendarEl, calendarEvents, state.view, state.selectedDay, (activity, day) => {
        // A specific event tag was clicked — select that activity.
        state.selectedActivityId = activity?.baseId ?? activity?.id ?? null;
        state.selectedDay = day ?? state.selectedDay;
        state.detailsMode = 'activity';
        render();
      }, currentMonthDate, {
        selectedBaseId: dayMode ? null : state.selectedActivityId,
        onSelectDay: (day) => {
          // A day cell was clicked — summarise everything happening that day.
          state.selectedDay = day;
          state.detailsMode = 'day';
          render();
        }
      });
      root.querySelector('#month-label').textContent = monthData.monthLabel || 'Loading…';
    }

    renderActivityList(uniqueActivities, showCalendar);

    const selectedActivity = dayMode
      ? null
      : (uniqueActivities.find(item => item.id === state.selectedActivityId) || uniqueActivities[0] || null);

    const mapEl = root.querySelector('#map');
    createMapView(mapEl, uniqueActivities, selectedActivity, (activity) => {
      state.selectedActivityId = activity.id;
      state.detailsMode = 'activity';
      state.scrollToSelected = true;
      render();
    });

    if (dayMode) {
      renderDayDetails(state.selectedDay, calendarEvents.filter(e => e.day === state.selectedDay), currentMonthDate);
    } else {
      renderDetails(selectedActivity);
    }
  }

  function renderFilters() {
    const exploreFiltersEl = root.querySelector('#explore-filters');
    const foodFiltersEl = root.querySelector('#food-filters');

    exploreFiltersEl.innerHTML = '';
    Object.entries(exploreCategoryLabels).forEach(([cat, label]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      const isActive = state.selectedCategory === cat;
      Object.assign(btn.style, {
        padding: '6px 12px',
        borderRadius: '999px',
        border: '1px solid #cbd5e1',
        background: isActive ? '#162033' : '#fff',
        color: isActive ? '#fff' : '#162033',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? '700' : '500'
      });
      btn.addEventListener('click', () => {
        state.selectedCategory = cat;
        state.selectedActivityId = null;
        state.detailsMode = 'activity';
        render();
      });
      exploreFiltersEl.appendChild(btn);
    });

    foodFiltersEl.innerHTML = '';
    Object.entries(foodCategoryLabels).forEach(([cat, label]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      const isActive = state.selectedCategory === cat;
      Object.assign(btn.style, {
        padding: '6px 12px',
        borderRadius: '999px',
        border: isActive ? '1px solid #c2410c' : '1px solid #fed7aa',
        background: isActive ? '#ea580c' : '#fff7ed',
        color: isActive ? '#fff' : '#9a3412',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? '700' : '500'
      });
      btn.addEventListener('click', () => {
        state.selectedCategory = cat;
        state.selectedActivityId = null;
        state.detailsMode = 'activity';
        render();
      });
      foodFiltersEl.appendChild(btn);
    });
  }

  function renderActivityList(displayActivities, showCalendar) {
    const activityListEl = root.querySelector('#activity-list');
    activityListEl.innerHTML = '';

    const listItems = state.selectedCategory === 'all'
      ? displayActivities
      : displayActivities.filter(item =>
          showCalendar
            ? eventCategories.includes(item.category)
            : nonCalendarCategories.includes(item.category)
        );

    if (!listItems.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#64748b;font-size:13px;padding:8px 0;';
      empty.textContent = state.loading
        ? 'Loading activities…'
        : 'No items match the selected category.';
      activityListEl.appendChild(empty);
      return;
    }

    let activeCard = null;
    listItems.forEach(activity => {
      const card = document.createElement('button');
      const isActive = state.selectedActivityId === activity.id;
      Object.assign(card.style, {
        border: '1px solid ' + (isActive ? '#93c5fd' : '#e2e8f0'),
        borderRadius: '10px',
        background: isActive ? '#eef4ff' : '#fbfdff',
        boxShadow: isActive ? '0 0 0 2px #bfdbfe' : 'none',
        padding: '10px 12px',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%'
      });
      const catColor = getCategoryDot(activity.category);
      // Recurring items (markets, weekly concerts) show a schedule summary instead
      // of a single date — the day-by-day breakdown lives in the calendar.
      const summary = activity.repeatLabel || activity.dateLabel;
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${catColor};flex-shrink:0;"></span>
          <span style="font-weight:700;font-size:14px;">${activity.title}</span>
        </div>
        <div style="color:#64748b;font-size:12px;margin-top:3px;padding-left:14px;">${summary} · ${activity.location}</div>
      `;
      card.addEventListener('click', () => {
        state.selectedActivityId = activity.id;
        state.detailsMode = 'activity';
        state.selectedDay = activity.day || state.selectedDay;
        render();
      });
      activityListEl.appendChild(card);
      if (isActive) activeCard = card;
    });

    // When the selection came from clicking a map marker, bring its list row into view.
    if (state.scrollToSelected && activeCard) {
      activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    state.scrollToSelected = false;
  }

  function getCategoryDot(category) {
    const colors = {
      highlight: '#e11d48', park: '#0d9488', route: '#059669', market: '#2563eb', concert: '#7c3aed',
      event: '#dc2626', museum: '#9333ea', 'walking-tour': '#16a34a',
      restaurant: '#ea580c', sandwich: '#d97706', coffeeshop: '#78350f',
      brewery: '#b45309'
    };
    return colors[category] || '#64748b';
  }

  function renderDetails(selectedActivity) {
    const detailsEl = root.querySelector('#details');

    if (!selectedActivity) {
      detailsEl.innerHTML = '<p style="margin:0;color:#4d5870;">Select an activity to see details.</p>';
      return;
    }

    const routeDetailBlock = selectedActivity.routeSummary
      ? `<div style="margin:10px 0;padding:10px 12px;border-radius:10px;background:#eef4ff;color:#24407a;font-size:13px;">${selectedActivity.routeSummary}</div>`
      : '';
    const repeatLabelBlock = selectedActivity.repeatLabel
      ? `<div style="margin:8px 0;color:#64748b;font-size:13px;">${selectedActivity.repeatLabel}</div>`
      : '';
    const metadataBlock = selectedActivity.duration || selectedActivity.distance
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;color:#64748b;font-size:13px;">${selectedActivity.duration ? `<span>${selectedActivity.duration}</span>` : ''}${selectedActivity.distance ? `<span>${selectedActivity.distance}</span>` : ''}</div>`
      : '';
    const isRoute = selectedActivity.category === 'walking-tour' || selectedActivity.category === 'route';
    const mapLinkLabel = isRoute ? 'Follow full route in Google Maps' : 'Open in maps';
    const routeLinks = selectedActivity.sourceUrl || selectedActivity.mapUrl
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          ${selectedActivity.mapUrl ? `<a href="${selectedActivity.mapUrl}" target="_blank" rel="noopener" style="text-decoration:none;background:#0f766e;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">🧭 ${mapLinkLabel}</a>` : ''}
          ${selectedActivity.sourceUrl ? `<a href="${selectedActivity.sourceUrl}" target="_blank" rel="noopener" style="text-decoration:none;background:#2563eb;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Route details</a>` : ''}
        </div>`
      : '';

    const showResearch = researchCategories.includes(selectedActivity.category);
    const reviewQuery = encodeURIComponent(`${selectedActivity.title} ${selectedActivity.location} Amsterdam`);
    const reviewBlock = (showResearch || selectedActivity.featuredIn)
      ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e7ebf2;">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">Research before you go</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${showResearch ? `<a href="https://www.google.com/maps/search/?api=1&query=${reviewQuery}" target="_blank" rel="noopener" style="text-decoration:none;background:#1a73e8;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">★ Reviews &amp; ratings</a>` : ''}
            ${showResearch ? `<a href="https://www.tripadvisor.com/Search?q=${reviewQuery}" target="_blank" rel="noopener" style="text-decoration:none;background:#00aa6c;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Tripadvisor</a>` : ''}
            ${selectedActivity.featuredIn ? `<a href="${selectedActivity.featuredUrl}" target="_blank" rel="noopener" style="text-decoration:none;background:#162033;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Featured in ${selectedActivity.featuredIn}</a>` : ''}
          </div>
        </div>`
      : '';

    detailsEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${getCategoryDot(selectedActivity.category)};"></span>
        <h3 style="margin:0;">${selectedActivity.title}</h3>
      </div>
      <p style="margin:0 0 6px;color:#4d5870;font-size:14px;">${selectedActivity.dateLabel} · ${selectedActivity.location}</p>
      ${repeatLabelBlock}
      <p style="margin:0 0 8px;font-size:14px;">${selectedActivity.description}</p>
      ${routeDetailBlock}
      ${metadataBlock}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=bicycling" target="_blank" rel="noopener" style="text-decoration:none;background:#162033;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Bike directions</a>
        <a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=transit" target="_blank" rel="noopener" style="text-decoration:none;background:#2563eb;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Transit directions</a>
        <a href="https://maps.apple.com/?saddr=Keizersgracht+61+Amsterdam&daddr=${selectedActivity.lat},${selectedActivity.lng}" target="_blank" rel="noopener" style="text-decoration:none;background:#0f766e;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Apple Maps</a>
        ${selectedActivity.category === 'walking-tour' ? `<a href="https://www.google.com/maps/dir/?api=1&origin=Keizersgracht+61+Amsterdam&destination=${selectedActivity.lat},${selectedActivity.lng}&travelmode=walking" target="_blank" rel="noopener" style="text-decoration:none;background:#7c3aed;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;">Start walk</a>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
        <button id="share-activity" style="border:0;background:#f59e0b;color:#fff;padding:8px 10px;border-radius:999px;font-size:13px;cursor:pointer;">Share</button>
      </div>
      ${routeLinks}
      ${reviewBlock}
    `;

    const shareButton = root.querySelector('#share-activity');
    if (shareButton) {
      shareButton.addEventListener('click', async () => {
        const shareText = `${selectedActivity.title} — ${selectedActivity.dateLabel} — ${selectedActivity.location}`;
        const shareUrl = selectedActivity.sourceUrl || `https://maps.google.com/?q=${selectedActivity.lat},${selectedActivity.lng}`;
        if (navigator.share) {
          try { await navigator.share({ title: selectedActivity.title, text: shareText, url: shareUrl }); }
          catch (e) { console.info('Share cancelled', e); }
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
        }
      });
    }
  }

  function renderDayDetails(day, dayEvents, currentMonthDate) {
    const detailsEl = root.querySelector('#details');
    const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
    const heading = date.toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!dayEvents.length) {
      detailsEl.innerHTML = `
        <h3 style="margin:0 0 6px;">${heading}</h3>
        <p style="margin:0;color:#4d5870;">Nothing on the calendar for this day in the current filter.</p>`;
      return;
    }

    detailsEl.innerHTML = `
      <h3 style="margin:0 0 4px;">${heading}</h3>
      <p style="margin:0 0 10px;color:#64748b;font-size:13px;">${dayEvents.length} thing${dayEvents.length > 1 ? 's' : ''} on this day · tap one for details</p>
      <div id="day-events" style="display:flex;flex-direction:column;gap:8px;"></div>`;

    const wrap = detailsEl.querySelector('#day-events');
    dayEvents.forEach(event => {
      const card = document.createElement('button');
      Object.assign(card.style, {
        border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fbfdff',
        padding: '10px 12px', textAlign: 'left', cursor: 'pointer', width: '100%'
      });
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${getCategoryDot(event.category)};flex-shrink:0;"></span>
          <span style="font-weight:700;font-size:14px;">${event.title}</span>
        </div>
        <div style="color:#64748b;font-size:12px;margin-top:3px;padding-left:14px;">${event.dateLabel} · ${event.location}</div>`;
      card.addEventListener('click', () => {
        state.selectedActivityId = event.baseId || event.id;
        state.detailsMode = 'activity';
        render();
      });
      wrap.appendChild(card);
    });
  }

  function getFilteredActivities(mergedActivities) {
    if (state.selectedCategory === 'all') return mergedActivities;
    return mergedActivities.filter(item => item.category === state.selectedCategory);
  }

  function expandRecurringActivities(activities, currentMonthDate) {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const expanded = [];

    activities.forEach(activity => {
      if (Array.isArray(activity.repeatDaysOfWeek) && activity.repeatDaysOfWeek.length) {
        for (let day = 1; day <= daysInMonth; day += 1) {
          const date = new Date(year, month, day);
          if (activity.repeatDaysOfWeek.includes(date.getDay())) {
            expanded.push({
              ...activity,
              id: `${activity.id}-${day}`,
              baseId: activity.id,
              day,
              dateLabel: `${date.toLocaleString('en-US', { weekday: 'short' })} ${day} ${date.toLocaleString('en-US', { month: 'short' })}`
            });
          }
        }
      } else {
        expanded.push({ ...activity, baseId: activity.id });
      }
    });

    return expanded.sort((a, b) => a.day - b.day || a.title.localeCompare(b.title));
  }

  function getMonthDate(offset) {
    return new Date(2026, 6 + offset, 1);
  }

  function getMonthKey(offset) {
    const base = getMonthDate(offset);
    return base.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
}
