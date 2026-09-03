import { DiffLine, DiffSummary } from '../types/json';

// Recursively sort object keys alphabetically
export function sortJsonKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  } else if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortJsonKeys(obj[key]);
      });
    return sorted;
  }
  return obj;
}

// Compute semantic line-by-line diff between two JSON strings
export function computeJsonDiff(
  leftStr: string,
  rightStr: string,
  options: { sortKeys?: boolean; indent?: 2 | 4 | 'tab' } = {}
): {
  lines: DiffLine[];
  summary: DiffSummary;
  leftError?: string;
  rightError?: string;
} {
  let leftObj: any = null;
  let rightObj: any = null;
  let leftError: string | undefined;
  let rightError: string | undefined;

  const indentSpace = options.indent === 'tab' ? '\t' : options.indent || 2;

  // Parse Left JSON
  try {
    if (leftStr.trim()) {
      leftObj = JSON.parse(leftStr);
      if (options.sortKeys) leftObj = sortJsonKeys(leftObj);
    }
  } catch (err: any) {
    leftError = `Left JSON Error: ${err.message}`;
  }

  // Parse Right JSON
  try {
    if (rightStr.trim()) {
      rightObj = JSON.parse(rightStr);
      if (options.sortKeys) rightObj = sortJsonKeys(rightObj);
    }
  } catch (err: any) {
    rightError = `Right JSON Error: ${err.message}`;
  }

  if (leftError || rightError || leftObj === null || rightObj === null) {
    return {
      lines: [],
      summary: {
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        identical: false,
        totalLines: 0,
      },
      leftError,
      rightError,
    };
  }

  const leftFormattedLines = JSON.stringify(leftObj, null, indentSpace).split('\n');
  const rightFormattedLines = JSON.stringify(rightObj, null, indentSpace).split('\n');

  const lines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  // LCS or Line Diff
  const maxLines = Math.max(leftFormattedLines.length, rightFormattedLines.length);

  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < leftFormattedLines.length || rightIdx < rightFormattedLines.length) {
    const lLine = leftFormattedLines[leftIdx];
    const rLine = rightFormattedLines[rightIdx];

    if (lLine === rLine) {
      lines.push({
        leftLineNumber: leftIdx + 1,
        rightLineNumber: rightIdx + 1,
        leftContent: lLine,
        rightContent: rLine,
        type: 'unchanged',
      });
      leftIdx++;
      rightIdx++;
    } else if (lLine !== undefined && rLine !== undefined) {
      // Line is modified or distinct
      const lTrim = lLine.trim();
      const rTrim = rLine.trim();

      const lKey = lTrim.split(':')[0];
      const rKey = rTrim.split(':')[0];

      if (lKey === rKey) {
        lines.push({
          leftLineNumber: leftIdx + 1,
          rightLineNumber: rightIdx + 1,
          leftContent: lLine,
          rightContent: rLine,
          type: 'modified',
        });
        modifiedCount++;
        leftIdx++;
        rightIdx++;
      } else {
        // Check lookahead
        const rLookahead = rightFormattedLines.slice(rightIdx + 1, rightIdx + 4).indexOf(lLine);
        const lLookahead = leftFormattedLines.slice(leftIdx + 1, leftIdx + 4).indexOf(rLine);

        if (rLookahead !== -1) {
          // Lines were added in right
          lines.push({
            rightLineNumber: rightIdx + 1,
            rightContent: rLine,
            type: 'added',
          });
          addedCount++;
          rightIdx++;
        } else if (lLookahead !== -1) {
          // Lines were removed in left
          lines.push({
            leftLineNumber: leftIdx + 1,
            leftContent: lLine,
            type: 'removed',
          });
          removedCount++;
          leftIdx++;
        } else {
          lines.push({
            leftLineNumber: leftIdx + 1,
            rightLineNumber: rightIdx + 1,
            leftContent: lLine,
            rightContent: rLine,
            type: 'modified',
          });
          modifiedCount++;
          leftIdx++;
          rightIdx++;
        }
      }
    } else if (lLine !== undefined) {
      lines.push({
        leftLineNumber: leftIdx + 1,
        leftContent: lLine,
        type: 'removed',
      });
      removedCount++;
      leftIdx++;
    } else {
      lines.push({
        rightLineNumber: rightIdx + 1,
        rightContent: rLine,
        type: 'added',
      });
      addedCount++;
      rightIdx++;
    }
  }

  const identical = addedCount === 0 && removedCount === 0 && modifiedCount === 0;

  return {
    lines,
    summary: {
      addedCount,
      removedCount,
      modifiedCount,
      identical,
      totalLines: lines.length,
    },
  };
}
