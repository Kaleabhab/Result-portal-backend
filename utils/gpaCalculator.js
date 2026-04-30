export const getGradePoint = (percent) => {
  if (percent >= 85) return 4.0;
  if (percent >= 70) return 3.0;
  if (percent >= 60) return 2.0;
  if (percent >= 50) return 1.0;
  return 0.0;
};

export const getLetterGrade = (percent) => {
  if (percent >= 85) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
};