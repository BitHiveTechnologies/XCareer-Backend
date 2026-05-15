export interface SchedulerConfig {
    jobAlertCron: string;
    retryFailedCron: string;
    enabled: boolean;
}
export declare class SchedulerService {
    private jobAlertTask;
    private retryFailedTask;
    private config;
    constructor(config: SchedulerConfig);
    start(): void;
    stop(): void;
    private startJobAlertTask;
    private startRetryFailedTask;
    /** Manual trigger — job alerts for all active jobs */
    triggerJobAlerts(dryRun?: boolean): Promise<any>;
    /** Manual trigger — retry all failed notifications */
    triggerRetryFailed(): Promise<any>;
    getStatus(): {
        enabled: boolean;
        jobAlertTaskRunning: boolean;
        retryFailedTaskRunning: boolean;
        config: SchedulerConfig;
    };
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=schedulerService.d.ts.map