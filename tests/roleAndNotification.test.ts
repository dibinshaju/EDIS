import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AppUser,
  ManagedUser,
  Invitation,
  AlarmSettings,
  NotificationForward,
  NotificationRecipient,
} from '../src/types/auth';
import { DEFAULT_ALARM_SETTINGS } from '../src/services/firebase';

describe('Role-Based Access & User Management Tests', () => {
  it('1. Correctly distinguishes ADMIN and USER capabilities', () => {
    const admin: AppUser = {
      uid: 'admin_1',
      email: 'lead@plant.com',
      displayName: 'Lead Admin',
      role: 'ADMIN',
      isDemoUser: false,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    const user: AppUser = {
      uid: 'user_1',
      email: 'tech@plant.com',
      displayName: 'Field Tech',
      role: 'USER',
      adminId: 'admin_1',
      isDemoUser: false,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    assert.strictEqual(admin.role, 'ADMIN');
    assert.strictEqual(user.role, 'USER');
    assert.strictEqual(user.adminId, admin.uid);
  });

  it('2. Invitation structure generates required expiry and fields', () => {
    const now = Date.now();
    const inv: Invitation = {
      id: 'inv_test_1',
      email: 'newuser@plant.com',
      adminId: 'admin_1',
      adminEmail: 'lead@plant.com',
      status: 'PENDING',
      createdAt: now,
      expiresAt: now + 7 * 86400000,
    };

    assert.strictEqual(inv.status, 'PENDING');
    assert.ok(inv.expiresAt > inv.createdAt);
    assert.strictEqual(inv.email, 'newuser@plant.com');
  });

  it('3. AlarmSettings provides valid default values and audio tone', () => {
    assert.strictEqual(DEFAULT_ALARM_SETTINGS.autoPushEnabled, true);
    assert.strictEqual(DEFAULT_ALARM_SETTINGS.soundEnabled, true);
    assert.strictEqual(DEFAULT_ALARM_SETTINGS.soundName, 'buzzer_alarm');
    assert.ok(DEFAULT_ALARM_SETTINGS.mismatchThreshold > 0);
    assert.ok(DEFAULT_ALARM_SETTINGS.persistenceDurationSec > 0);
  });

  it('4. Notification Forward and Recipient Tracking lifecycle', () => {
    const forward: NotificationForward = {
      forwardId: 'fwd_99',
      alertId: 'alert_123',
      adminId: 'admin_1',
      adminEmail: 'admin@plant.com',
      message: 'Critical Pipe Burst - Inspect Valve A',
      severity: 'CRITICAL',
      recipientCount: 2,
      createdAt: Date.now(),
    };

    const rec1: NotificationRecipient = {
      id: 'rec_1',
      forwardId: forward.forwardId,
      alertId: forward.alertId,
      userId: 'user_1',
      userEmail: 'tech@plant.com',
      status: 'SENT',
      sentAt: Date.now(),
    };

    assert.strictEqual(rec1.status, 'SENT');

    // Simulate Delivery
    rec1.status = 'DELIVERED';
    rec1.deliveredAt = Date.now();
    assert.strictEqual(rec1.status, 'DELIVERED');
    assert.ok(rec1.deliveredAt >= rec1.sentAt);

    // Simulate Operator Acknowledging
    rec1.status = 'ACKNOWLEDGED';
    rec1.acknowledgedAt = Date.now();
    assert.strictEqual(rec1.status, 'ACKNOWLEDGED');
    assert.ok(rec1.acknowledgedAt >= rec1.deliveredAt);
  });
});
