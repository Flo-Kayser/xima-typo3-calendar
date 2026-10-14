export type CalendarFilterOption = {
  value: string | number;
  label: string;
};

export type TreeFilterItem = CalendarFilterOption & {
  parentUid: string | number | null;
};

export type TreeCalendarFilter = {
  type: 'tree';
  identifier: string;
  title: string;
  colorCoded: boolean;
  items: TreeFilterItem[];
};

export type CheckboxCalendarFilter = {
  type: 'checkbox-list';
  identifier: string;
  title: string;
  items: CalendarFilterOption[];
};

export type CalendarFilter = TreeCalendarFilter | CheckboxCalendarFilter;

export type CalendarFilterOptions = {
  types: CalendarFilterOption[];
  filters: Record<string, CalendarFilter>;
};

export type CalendarFilterState = {
  activeTypes: string[];
  checkboxLists: Record<string, Array<string | number>>;
  trees: Record<string, CalendarFilterTreeState>;
};

export type CalendarFilterTreeState = {
  activeItems: Array<string | number>;
  expandedItems: Record<string, boolean>;
};

export type CalendarFilterSelection = {
  types: string[];
  filters: Record<string, Array<string | number>>;
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
