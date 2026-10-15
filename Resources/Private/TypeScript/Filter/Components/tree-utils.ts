export type TreeValue = string | number;

export function updateTreeSelection(
  activeItems: TreeValue[],
  value: TreeValue,
  selected: boolean,
): TreeValue[] {
  return selected
    ? [...new Set([...activeItems, value])]
    : activeItems.filter((item) => item !== value);
}

export function updateTreeExpansion(
  expandedItems: Record<TreeValue, boolean>,
  value: TreeValue,
  expanded: boolean,
): Record<TreeValue, boolean> {
  return {
    ...expandedItems,
    [value]: expanded,
  };
}
