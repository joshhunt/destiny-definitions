import { AllTableDiff } from "./diff";

let diffs: AllTableDiff;

export const setDiffs = (value: AllTableDiff) => (diffs = value);
export const getDiffs = () => diffs;
