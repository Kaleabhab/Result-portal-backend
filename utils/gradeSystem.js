// ===============================
// GRADE SYSTEM UTILITY
// ===============================

/**
 * Get grade letter from percentage
 * @param {number} percentage - Score percentage (0-100)
 * @returns {string} Grade letter (A+, A, A-, B+, B, C+, C, D, F)
 */
const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

/**
 * Get status from grade
 * @param {string} grade - Grade letter
 * @returns {string} Status (PASS, RE-EXAM, RETAKE)
 */
const getStatus = (grade) => {
  if (grade === "F") return "RETAKE";
  if (grade === "D") return "RE-EXAM";
  return "PASS";
};

/**
 * Get grade with details (grade, status, points)
 * @param {number} percentage - Score percentage
 * @returns {object} { grade, status, points }
 */
const getGradeDetails = (percentage) => {
  const grade = getGrade(percentage);
  const status = getStatus(grade);
  
  let points = 0;
  if (grade === "A+" || grade === "A") points = 4.0;
  else if (grade === "A-") points = 3.7;
  else if (grade === "B+") points = 3.3;
  else if (grade === "B") points = 3.0;
  else if (grade === "C+") points = 2.5;
  else if (grade === "C") points = 2.0;
  else if (grade === "D") points = 1.0;
  else points = 0;
  
  return { grade, status, points };
};

/**
 * Get academic standing from CGPA
 * @param {number} cgpa - Cumulative GPA
 * @returns {string} Academic standing
 */
const getAcademicStanding = (cgpa) => {
  if (cgpa >= 3.5) return "First Class Honours";
  if (cgpa >= 3.0) return "Second Class Honours (Upper)";
  if (cgpa >= 2.5) return "Second Class Honours (Lower)";
  if (cgpa >= 2.0) return "Third Class Honours";
  if (cgpa >= 1.0) return "Pass";
  return "Academic Probation";
};

/**
 * Calculate module percentage from subject contributions
 * @param {Array} subjects - Array of subject objects with contributionToModule
 * @returns {number} Total module percentage
 */
const calculateModulePercentage = (subjects) => {
  return subjects.reduce((sum, subject) => sum + (subject.contributionToModule || 0), 0);
};

export {
  getGrade,
  getStatus,
  getGradeDetails,
  getAcademicStanding,
  calculateModulePercentage,
};