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
    /**
     * Start all scheduled tasks
     */
    start(): void;
    /**
     * Stop all scheduled tasks
     */
    stop(): void;
    /**
     * Start job alert task
     */
    private startJobAlertTask;
    /**
     * Start retry failed notifications task
     */
    private startRetryFailedTask;
    /**
     * Manually trigger job alerts
     */
    triggerJobAlerts(dryRun?: boolean): Promise<any>;
    /**
     * Manually trigger retry failed notifications
     */
    triggerRetryFailed(): Promise<any>;
    /**
     * Get scheduler status
     */
    getStatus(): {
        enabled: boolean;
        jobAlertTask: boolean;
        retryFailedTask: boolean;
        config: SchedulerConfig;
    };
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=schedulerService.d.ts.map