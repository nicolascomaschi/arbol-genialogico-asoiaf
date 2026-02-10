export const parseYear = (dateStr?: string): number | null => {
  if (!dateStr) return null;

  // Remove common prefixes/suffixes for cleaner parsing
  const cleanStr = dateStr.replace(/c\.|circa|born|died|after|before/gi, '').trim();

  // Extract the first number found
  const match = cleanStr.match(/(\d+)/);
  if (!match) return null;

  let year = parseInt(match[0], 10);

  // Check for BC (Before Conquest) indicators
  if (/bc|b\.c\.|a\.c\.|\boc\b/i.test(cleanStr)) {
      // Note: In Spanish "a.C." is Antes de Cristo (BC equivalent for real world, but ASOIAF uses BC/AC typically or a.C for Spanish translations)
      // Let's assume standard ASOIAF: BC (Before Conquest) / AC (After Conquest)
      // If the user inputs "a.C." (Spanish: Antes de Cristo/Conquista), treat as negative.
      year = -year;
  }

  return year;
};

export const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} BC`;
  return `${year} AC`;
};
