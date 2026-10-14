export type CalendarFilterOption = {
  value: string | number;
  label: string;
  appearance?: string;
  icon?: string;
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
  filters: Record<string, CalendarFilter>;
};

export type CalendarFilterState = {
  checkboxLists: Record<string, Array<string | number>>;
  trees: Record<string, CalendarFilterTreeState>;
};

export type CalendarFilterTreeState = {
  activeItems: Array<string | number>;
  expandedItems: Record<string, boolean>;
};

export type CalendarFilterSelection = {
  filters: Record<string, Array<string | number>>;
};

export type CalendarFilterResponse = {
  success: boolean;
  options: CalendarFilterOptions;
  state: CalendarFilterState;
};
