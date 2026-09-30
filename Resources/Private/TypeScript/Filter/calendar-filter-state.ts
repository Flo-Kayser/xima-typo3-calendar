export type CalendarFilterOption = {
  value: string | number;
  label: string;
};

export type CalendarCategoryOption = CalendarFilterOption & {
  value: number;
  parentUid: number | null;
};

export type CalendarFilterOptions = {
  types: CalendarFilterOption[];
  categories: CalendarCategoryOption[];
  statuses: CalendarFilterOption[];
};

export type CalendarFilterState = {
  activeTypes: string[];
  activeCategories: number[];
  activeStatuses: number[];
  expanded: {
    categoryNodes: Record<number, boolean>;
  };
};

export type CalendarFilterSelection = {
  types: string[];
  categories: number[];
  statuses: number[];
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
