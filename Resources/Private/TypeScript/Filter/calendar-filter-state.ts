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
    type: boolean;
    categories: boolean;
    status: boolean;
    categoryNodes: Record<number, boolean>;
  };
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
