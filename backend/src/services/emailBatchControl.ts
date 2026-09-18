/**
 * emailBatchControl — shared, in-memory control + live progress for the
 * currently-running email/job-alert batch.
 *
 * Because a batch runs inside a single request but Node handles requests
 * concurrently, a separate `POST /jobs/alerts/stop` request can flip the
 * stop flag while a batch is mid-flight. The sending loops check
 * `isStopRequested()` between recipients and abort cleanly, marking the
 * remaining recipients as skipped. `GET /jobs/alerts/progress` reads the
 * live counters.
 */
import { logger } from '../utils/logger';

export type EmailBatchType = 'single-job' | 'all-jobs' | 'retry';

export interface EmailBatchState {
  active: boolean;
  batchId: string | null;
  type: EmailBatchType | null;
  total: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  stopRequested: boolean;
  cancelled: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
}

const initial = (): EmailBatchState => ({
  active: false,
  batchId: null,
  type: null,
  total: 0,
  processed: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  stopRequested: false,
  cancelled: false,
  startedAt: null,
  finishedAt: null,
  lastError: null
});

let state: EmailBatchState = initial();

/** Begin tracking a new batch. Refuses if one is already active. */
export const startBatch = (type: EmailBatchType, total: number): string | null => {
  if (state.active) {
    logger.warn('startBatch called while a batch is already active', { current: state.batchId });
    return null;
  }
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  state = { ...initial(), active: true, batchId, type, total, startedAt: new Date().toISOString() };
  logger.info('Email batch started', { batchId, type, total });
  return batchId;
};

export const recordSent = (n = 1): void => { state.sent += n; state.processed += n; };
export const recordFailed = (err?: unknown, n = 1): void => {
  state.failed += n;
  state.processed += n;
  if (err) state.lastError = err instanceof Error ? err.message : String(err);
};
export const recordSkipped = (n = 1): void => { state.skipped += n; state.processed += n; };

/** Request the active batch to stop. Returns false if nothing is running. */
export const requestStop = (): boolean => {
  if (!state.active) return false;
  state.stopRequested = true;
  logger.info('Email batch stop requested', { batchId: state.batchId });
  return true;
};

export const isStopRequested = (): boolean => state.active && state.stopRequested;

/** Mark the batch finished (naturally or cancelled). */
export const finishBatch = (): EmailBatchState => {
  state.active = false;
  state.finishedAt = new Date().toISOString();
  if (state.stopRequested) state.cancelled = true;
  logger.info('Email batch finished', {
    batchId: state.batchId,
    sent: state.sent,
    failed: state.failed,
    skipped: state.skipped,
    cancelled: state.cancelled
  });
  return { ...state };
};

export const getBatchState = (): EmailBatchState => ({ ...state });
