export type CalendarFilterOption = {
  value: string | number;
  label: string;
};

export type CalendarCategoryOption = CalendarFilterOption & {
  value: number;
  parentUid: number | null;
};

export type TreeCalendarFilter = {
  identifier: string;
  title: string;
  colorCoded: boolean;
  items: CalendarCategoryOption[];
};

export type CalendarFilterOptions = {
  types: CalendarFilterOption[];
  categories: TreeCalendarFilter;
  statuses: CalendarFilterOption[];
};

export type CalendarFilterState = {
  activeTypes: string[];
  activeCategories: number[];
  activeStatuses: Array<number | string>;
  expanded: {
    categoryNodes: Record<number, boolean>;
  };
};

export type CalendarFilterSelection = {
  types: string[];
  categories: number[];
  statuses: Array<number | string>;
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
