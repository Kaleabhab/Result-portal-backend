export const validateStudentData = (data) => {
  const requiredFields = [
    'studentId',
    'fullName',
    'email',
    'gender',
    'dateOfBirth',
    'department',
    'class',
    'admissionYear',
    'academicYear',
  ];

  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return `${field} is required`;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Invalid email format';
  }

  if (!['Male', 'Female', 'Other'].includes(data.gender)) {
    return 'Gender must be Male, Female, or Other';
  }

  if (isNaN(Date.parse(data.dateOfBirth))) {
    return 'Invalid date of birth';
  }

  const year = Number(data.admissionYear);
  if (isNaN(year) || year < 1900 || year > 2100) {
    return 'Invalid admission year';
  }

  return null;
};