import { Todo } from '../src/lib/sync';
import { openDB } from 'idb';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ error: 'Sync code is required' });
    return;
  }

  try {
    const db = await openDB('todos-db', 1);
    const todos = await db.getAll('todos');

    const events = todos
      .filter(todo => todo.dueDate)
      .map(todo => {
        const dueDate = new Date(todo.dueDate);
        const uid = `${todo.id}@todos-app`;
        return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${new Date(todo.createdAt).toISOString().replace(/[-:.]/g, '').slice(0, -4)}Z
DTSTART;VALUE=DATE:${dueDate.toISOString().slice(0, 10).replace(/-/g, '')}
SUMMARY:${todo.text}${todo.completed ? ' (Completed)' : ''}
STATUS:${todo.completed ? 'COMPLETED' : 'NEEDS-ACTION'}
END:VEVENT`;
      })
      .join('\n');

    const calendar = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Todos App//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:My Todos
REFRESH-INTERVAL;VALUE=DURATION:PT1H
X-PUBLISHED-TTL:PT1H
${events}
END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate calendar feed' });
  }
}