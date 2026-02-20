export const parseYear = (dateStr?: string): number | null => {
  if (!dateStr) return null;

  const cleanStr = dateStr.trim();

  // Extract the first number found
  const match = cleanStr.match(/(\d+)/);
  if (!match) return null;

  let year = parseInt(match[0], 10);

  // Check for AC/BC indicators in the original string
  // Matches "AC", "BC", "a.C.", "b.c.", "a.c" anywhere in the string
  if (/ac|a\.c|bc|b\.c/i.test(cleanStr)) {
      year = -year;
  }

  return year;
};

export const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} AC`;
  return `${year} DC`;
};
