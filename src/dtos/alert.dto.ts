export interface CreateAlertDTO {
  userId: string;
  type: 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  relatedData?: any;
}

export interface UpdateAlertDTO {
  isRead?: boolean;
  isDismissed?: boolean;
}

export interface AlertFilter {
  type?: 'overspending' | 'goal_progress' | 'unusual_pattern' | 'recommendation';
  severity?: 'info' | 'warning' | 'critical';
  isRead?: boolean;
  isDismissed?: boolean;
}
