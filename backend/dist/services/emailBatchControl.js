"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBatchState = exports.finishBatch = exports.isStopRequested = exports.requestStop = exports.recordSkipped = exports.recordFailed = exports.recordSent = exports.startBatch = void 0;
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
const logger_1 = require("../utils/logger");
const initial = () => ({
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
let state = initial();
/** Begin tracking a new batch. Refuses if one is already active. */
const startBatch = (type, total) => {
    if (state.active) {
        logger_1.logger.warn('startBatch called while a batch is already active', { current: state.batchId });
        return null;
    }
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state = { ...initial(), active: true, batchId, type, total, startedAt: new Date().toISOString() };
    logger_1.logger.info('Email batch started', { batchId, type, total });
    return batchId;
};
exports.startBatch = startBatch;
const recordSent = (n = 1) => { state.sent += n; state.processed += n; };
exports.recordSent = recordSent;
const recordFailed = (err, n = 1) => {
    state.failed += n;
    state.processed += n;
    if (err)
        state.lastError = err instanceof Error ? err.message : String(err);
};
exports.recordFailed = recordFailed;
const recordSkipped = (n = 1) => { state.skipped += n; state.processed += n; };
exports.recordSkipped = recordSkipped;
/** Request the active batch to stop. Returns false if nothing is running. */
const requestStop = () => {
    if (!state.active)
        return false;
    state.stopRequested = true;
    logger_1.logger.info('Email batch stop requested', { batchId: state.batchId });
    return true;
};
exports.requestStop = requestStop;
const isStopRequested = () => state.active && state.stopRequested;
exports.isStopRequested = isStopRequested;
/** Mark the batch finished (naturally or cancelled). */
const finishBatch = () => {
    state.active = false;
    state.finishedAt = new Date().toISOString();
    if (state.stopRequested)
        state.cancelled = true;
    logger_1.logger.info('Email batch finished', {
        batchId: state.batchId,
        sent: state.sent,
        failed: state.failed,
        skipped: state.skipped,
        cancelled: state.cancelled
    });
    return { ...state };
};
exports.finishBatch = finishBatch;
const getBatchState = () => ({ ...state });
exports.getBatchState = getBatchState;
//# sourceMappingURL=emailBatchControl.js.map