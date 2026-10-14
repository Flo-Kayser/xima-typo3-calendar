export type CalendarFilterOption = {
  value: string | number;
  label: string;
};

export type TreeFilterItem = CalendarFilterOption & {
  parentUid: string | number | null;
};

export type TreeCalendarFilter = {
  identifier: string;
  title: string;
  colorCoded: boolean;
  items: TreeFilterItem[];
};

export type CalendarFilterOptions = {
  types: CalendarFilterOption[];
  trees: Record<string, TreeCalendarFilter>;
  statuses: CalendarFilterOption[];
};

export type CalendarFilterState = {
  activeTypes: string[];
  activeStatuses: Array<number | string>;
  trees: Record<string, CalendarFilterTreeState>;
};

export type CalendarFilterTreeState = {
  activeItems: Array<string | number>;
  expandedItems: Record<string, boolean>;
};

export type CalendarFilterSelection = {
  types: string[];
  trees: Record<string, Array<string | number>>;
  categories: number[];
  statuses: Array<number | string>;
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
