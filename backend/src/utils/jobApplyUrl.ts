import { config } from '../config/environment';

const DEFAULT_FRONTEND = 'https://xcareers.in';

function frontendBase(): string {
  const raw = config.FRONTEND_URL || process.env.FRONTEND_URL || DEFAULT_FRONTEND;
  const cleaned = (raw.replace(/\/$/, '') || DEFAULT_FRONTEND);
  // Emails must never point recipients at the API host's localhost.
  if (/localhost|127\.0\.0\.1/i.test(cleaned)) {
    return DEFAULT_FRONTEND;
  }
  return cleaned;
}

export function isHttpUrl(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function slugifyPathSegment(value: string): string {
  return (value || 'role')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Absolute URL for "Apply Now" in emails.
 * Prefer the job's applicationLink (the URL the admin entered). Never use
 * `/jobs/:id` — that route does not exist on the website.
 */
export function resolveJobApplyUrl(job: {
  applicationLink?: string | null;
  type?: string;
  company?: string;
  title?: string;
}): string {
  const direct = (job.applicationLink || '').trim();
  if (isHttpUrl(direct)) {
    return direct;
  }

  const base = frontendBase();
  // Old bulk emails used `/jobs/:mongoId`, which is not a real website route.
  if (direct.startsWith('/') && /\/(apply|view-details)\//.test(direct)) {
    return `${base}${direct}`;
  }

  const kind = job.type === 'internship' ? 'internships' : 'jobs';
  const company = slugifyPathSegment(job.company || 'company');
  const title = slugifyPathSegment(job.title || 'role');
  return `${base}/${kind}/apply/${company}/${title}`;
}
