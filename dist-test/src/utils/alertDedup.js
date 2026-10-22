"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertDeduplicator = void 0;
class AlertDeduplicator {
    activeAlertsByCategory = new Map();
    lastAlertTimestampByCategory = new Map();
    cooldownMs;
    constructor(cooldownSeconds = 60) {
        this.cooldownMs = cooldownSeconds * 1000;
    }
    /**
     * Generates a unique stable ID for an alert event
     */
    generateAlertId(category, timestamp) {
        const randomHex = Math.random().toString(36).substring(2, 7);
        return `ALT-${category}-${timestamp}-${randomHex}`;
    }
    /**
     * Processes an alert candidate and returns an AlertEvent if a new alert or significant update is warranted.
     */
    processCandidate(candidate, reading, now = Date.now()) {
        const existing = this.activeAlertsByCategory.get(candidate.category);
        const lastTimestamp = this.lastAlertTimestampByCategory.get(candidate.category) || 0;
        // If there is an existing ACTIVE or ACKNOWLEDGED alert for this category
        if (existing && existing.status !== 'RESOLVED') {
            // If already acknowledged, we don't spam buzzer or create new duplicate event
            existing.occurrenceCount += 1;
            existing.inletFlow = reading.inletFlow;
            existing.outletFlow = reading.outletFlow;
            existing.flowDifference = reading.flowDifference;
            existing.durationSec = candidate.durationSec;
            return { isNew: false, event: existing };
        }
        // Cooldown check for recently resolved categories
        if (now - lastTimestamp < this.cooldownMs && candidate.category !== 'RECOVERED') {
            return null;
        }
        // Create a brand new alert event
        const newEvent = {
            id: this.generateAlertId(candidate.category, now),
            category: candidate.category,
            severity: candidate.severity,
            status: 'ACTIVE',
            title: candidate.title,
            explanation: candidate.explanation,
            timestamp: now,
            inletFlow: reading.inletFlow,
            outletFlow: reading.outletFlow,
            flowDifference: reading.flowDifference,
            durationSec: candidate.durationSec,
            isSimulated: reading.isSimulated,
            source: reading.isSimulated ? 'demo' : 'wokwi',
            occurrenceCount: 1,
        };
        this.activeAlertsByCategory.set(candidate.category, newEvent);
        this.lastAlertTimestampByCategory.set(candidate.category, now);
        return { isNew: true, event: newEvent };
    }
    /**
     * Mark an alert as acknowledged by user
     */
    acknowledgeAlert(alertId, adminName = 'Admin') {
        for (const alert of this.activeAlertsByCategory.values()) {
            if (alert.id === alertId && alert.status === 'ACTIVE') {
                alert.status = 'ACKNOWLEDGED';
                alert.acknowledgedAt = Date.now();
                alert.acknowledgedBy = adminName;
                return alert;
            }
        }
        return null;
    }
    /**
     * Mark active incident of a category as resolved
     */
    resolveCategory(category, now = Date.now()) {
        const existing = this.activeAlertsByCategory.get(category);
        if (existing && existing.status !== 'RESOLVED') {
            existing.status = 'RESOLVED';
            existing.resolvedAt = now;
            this.activeAlertsByCategory.delete(category);
            return existing;
        }
        return null;
    }
    /**
     * Reset tracking state
     */
    clear() {
        this.activeAlertsByCategory.clear();
        this.lastAlertTimestampByCategory.clear();
    }
}
exports.AlertDeduplicator = AlertDeduplicator;
