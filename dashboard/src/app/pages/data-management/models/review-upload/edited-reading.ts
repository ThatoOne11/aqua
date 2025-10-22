export type EditedReading = {
  rowNumber: number;
  field: string;
  oldValue: string;
  newValue: string;
};

export type EditedReadings = {
  [reading_id: string]: EditedReading[];
};

export function formatEditedReadingsSummary(
  editedReadings: EditedReadings
): string {
  return Object.values(editedReadings)
    .map((edits) => {
      if (edits.length === 0) return '';
      const rowNumber = edits[0].rowNumber;

      const editsSummary = edits
        .map(
          (e) =>
            `Field "${e.field}" changed from "${e.oldValue}" to "${e.newValue}"`
        )
        .join('\n');

      return `Row ${rowNumber}:\n${editsSummary}`;
    })
    .filter(Boolean)
    .join('\n\n');
}
