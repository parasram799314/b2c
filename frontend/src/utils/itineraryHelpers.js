// utils/itineraryHelpers.js

export function parseDays(itinerary = '') {
  if (!itinerary) return [];
  const dayRegex = /##\s*Day\s*(\d+)\s*[·\-–—]?\s*([^\n]*)/gi;
  const days = [];
  let match;
  const lines = itinerary.split('\n');

  let currentDay = null;
  let currentLines = [];

  for (const line of lines) {
    const m = line.match(/^##\s*Day\s*(\d+)\s*[·\-–—]?\s*(.*)/i);
    if (m) {
      if (currentDay !== null) {
        days.push({ day: currentDay.day, title: currentDay.title, content: currentLines.join('\n').trim() });
      }
      currentDay = { day: parseInt(m[1]), title: m[2]?.trim() || `Day ${m[1]}` };
      currentLines = [];
    } else if (currentDay) {
      // Skip meta lines
      if (!line.match(/^##\s*(Travel Type|Recommended Transfer|Practical Tips)/i)) {
        currentLines.push(line);
      }
    }
  }

  if (currentDay) {
    days.push({ day: currentDay.day, title: currentDay.title, content: currentLines.join('\n').trim() });
  }

  return days;
}

export function extractNotes(itinerary = '') {
  if (!itinerary) return [];
  const notesSection = itinerary.match(/##\s*Practical Tips[\s\S]*/i)?.[0] || '';
  const lines = notesSection
    .split('\n')
    .slice(1)
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.replace(/^-\s*/, '').trim())
    .filter(Boolean);
  return lines;
}

export function extractTravelType(itinerary = '') {
  return itinerary.match(/##\s*Travel Type:\s*(.+)/i)?.[1]?.trim() || 'General';
}

export function extractTransportMode(itinerary = '') {
  return itinerary.match(/##\s*Recommended Transfer:\s*(.+)/i)?.[1]?.trim() || 'Flight';
}