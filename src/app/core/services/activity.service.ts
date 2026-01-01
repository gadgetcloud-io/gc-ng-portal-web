/**
 * Activity Service - Fetches and manages user activity from audit logs
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Activity interface - User-friendly representation of audit logs
 */
export interface Activity {
  id: string;
  eventType: string;
  actorId: string;
  actorEmail: string;
  targetId?: string;
  targetEmail?: string;
  timestamp: string; // ISO 8601 timestamp
  description: string; // Human-readable description
  icon: string; // Emoji icon based on event type
  relativeTime?: string; // e.g., "2 hours ago"
}

/**
 * Raw audit log from backend
 */
interface AuditLog {
  id: string;
  eventType: string;
  actorId: string;
  actorEmail: string;
  targetId?: string;
  targetEmail?: string;
  timestamp: string;
  changes?: Record<string, { old: any; new: any }>;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Get recent activity from audit logs
   * @param limit Number of activities to fetch (default: 10)
   * @returns Observable of Activity array
   */
  getRecentActivity(limit: number = 10): Observable<Activity[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', '0');

    return this.http.get<AuditLog[]>(this.apiUrl, { params }).pipe(
      map(logs => logs.map(log => this.mapAuditLogToActivity(log))),
      catchError(error => {
        console.error('Error fetching activity logs:', error);
        // Return empty array on error (graceful degradation)
        return of([]);
      })
    );
  }

  /**
   * Map raw audit log to user-friendly Activity
   */
  private mapAuditLogToActivity(log: AuditLog): Activity {
    return {
      id: log.id,
      eventType: log.eventType,
      actorId: log.actorId,
      actorEmail: log.actorEmail,
      targetId: log.targetId,
      targetEmail: log.targetEmail,
      timestamp: log.timestamp,
      description: this.getDescriptionForEvent(log),
      icon: this.getIconForEventType(log.eventType),
      relativeTime: this.getRelativeTime(log.timestamp)
    };
  }

  /**
   * Get human-readable description for audit log event
   */
  private getDescriptionForEvent(log: AuditLog): string {
    const actorName = this.getNameFromEmail(log.actorEmail);
    const targetName = log.targetEmail ? this.getNameFromEmail(log.targetEmail) : null;

    switch (log.eventType) {
      case 'auth.login_success':
        return `${actorName} logged in`;

      case 'auth.login_failed':
        return `Failed login attempt for ${actorName}`;

      case 'user.created':
        return targetName
          ? `${actorName} created user ${targetName}`
          : `${actorName} created a new user`;

      case 'user.updated':
        return targetName
          ? `${actorName} updated user ${targetName}`
          : `${actorName} updated user profile`;

      case 'user.role_changed':
        if (log.changes?.['role']) {
          const { old: oldRole, new: newRole } = log.changes['role'];
          return targetName
            ? `${actorName} changed ${targetName}'s role from ${oldRole} to ${newRole}`
            : `Role changed from ${oldRole} to ${newRole}`;
        }
        return `${actorName} changed user role`;

      case 'user.deactivated':
        return targetName
          ? `${actorName} deactivated user ${targetName}`
          : `${actorName} deactivated a user`;

      case 'user.reactivated':
        return targetName
          ? `${actorName} reactivated user ${targetName}`
          : `${actorName} reactivated a user`;

      case 'user.password_changed':
        return `${actorName} changed password`;

      case 'item.field_updated':
        if (log.changes) {
          const fieldNames = Object.keys(log.changes);
          const fieldList = fieldNames.length > 1
            ? `${fieldNames.length} fields`
            : fieldNames[0];
          return `${actorName} updated gadget ${fieldList}`;
        }
        return `${actorName} updated a gadget`;

      case 'user.field_updated':
        if (log.changes) {
          const fieldNames = Object.keys(log.changes);
          return `${actorName} updated ${fieldNames.join(', ')}`;
        }
        return `${actorName} updated profile`;

      case 'ticket.field_updated':
        if (log.changes) {
          const fieldNames = Object.keys(log.changes);
          return `${actorName} updated ticket ${fieldNames.join(', ')}`;
        }
        return `${actorName} updated a service ticket`;

      case 'auth.permission_denied':
        return `Access denied for ${actorName}`;

      default:
        return `${actorName} performed ${log.eventType}`;
    }
  }

  /**
   * Get icon emoji for event type
   */
  private getIconForEventType(eventType: string): string {
    const iconMap: Record<string, string> = {
      'auth.login_success': '🔐',
      'auth.login_failed': '🚫',
      'auth.permission_denied': '⛔',
      'user.created': '👤',
      'user.updated': '✏️',
      'user.role_changed': '🔄',
      'user.deactivated': '❌',
      'user.reactivated': '✅',
      'user.password_changed': '🔑',
      'user.deleted': '🗑️',
      'item.field_updated': '📱',
      'user.field_updated': '✏️',
      'ticket.field_updated': '📝'
    };

    return iconMap[eventType] || '📋';
  }

  /**
   * Extract name from email (before @ symbol)
   */
  private getNameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  private getRelativeTime(timestamp: string): string {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
  }
}
