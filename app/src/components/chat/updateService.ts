/**
 * updateService.ts
 * Centralized service to handle application state updates
 */

// Define event types
export type UpdateEventType =
    | 'user-stats-updated'
    | 'team-score-updated'
    | 'achievement-unlocked'
    | 'user-data-updated';

// Define event detail types
export interface TeamScoreUpdateDetail {
    teamId: string;
    newScore: number;
    pointChange: number;
}

export interface UserStatsUpdateDetail {
    userId: string;
    stats: Record<string, any>;
}

export interface AchievementUnlockedDetail {
    achievementId: string;
    achievementName: string;
}

/**
 * Dispatch an event to notify components about data updates
 */
export const dispatchUpdateEvent = <T>(eventType: UpdateEventType, detail: T): void => {
    console.log(`Dispatching event: ${eventType}`, detail);

    const event = new CustomEvent(eventType, {
        detail,
        bubbles: true,
        cancelable: true
    });

    window.dispatchEvent(event);
};

/**
 * Force a refresh of all application data
 * This is a utility function to trigger a full refresh when needed
 */
export const forceDataRefresh = (): void => {
    dispatchUpdateEvent('user-data-updated', { timestamp: Date.now() });
};

/**
 * Add a debug log for when events are triggered
 */
export const setupEventDebugLogging = (): () => void => {
    const logEvent = (e: Event) => {
        console.log(`Event received: ${e.type}`, (e as CustomEvent).detail);
    };

    // Listen for all update events
    window.addEventListener('user-stats-updated', logEvent);
    window.addEventListener('team-score-updated', logEvent);
    window.addEventListener('achievement-unlocked', logEvent);
    window.addEventListener('user-data-updated', logEvent);

    // Return cleanup function
    return () => {
        window.removeEventListener('user-stats-updated', logEvent);
        window.removeEventListener('team-score-updated', logEvent);
        window.removeEventListener('achievement-unlocked', logEvent);
        window.removeEventListener('user-data-updated', logEvent);
    };
};
