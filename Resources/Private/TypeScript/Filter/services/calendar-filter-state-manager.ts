import {CheckboxListChangePayload} from "../components/calendar-filter-checkbox-list";
import {CalendarFilterState} from "../calendar-filter-state";
import {TreeStateChangePayload} from "../components/calendar-filter-tree";

export function updateCheckboxListState(
  state: CalendarFilterState,
  change: CheckboxListChangePayload,
): CalendarFilterState {

  const {identifier, value, selected} = change;

  return {
    ...state,
    checkboxLists: {
      ...state.checkboxLists,
      [identifier]: selected
        ? [
          ...new Set([
            ...(state.checkboxLists[identifier] ?? []),
            value,
          ]),
        ]
        : (state.checkboxLists[identifier] ?? [])
          .filter((item) => item !== value),
    },
  }
}

export function updateTreeState(
  state: CalendarFilterState,
  change: TreeStateChangePayload,
): CalendarFilterState {
  return {
    ...state,
    trees: {
      ...state.trees,
      [change.identifier]: {
        activeItems: [...change.activeItems],
        expandedItems: {...change.expandedItems},
      },
    },
  }
}

