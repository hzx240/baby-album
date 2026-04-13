export interface TimelineEntry {
  period: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  photoCount: number;
  milestoneCount: number;
  milestones: unknown[];
  ageAtPeriod?: string;
}
