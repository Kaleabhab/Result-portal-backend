import XLSX from 'xlsx';

export const parseStudentExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  const mappedData = data.map((row) => {
    const student = {};
    const keys = Object.keys(row);
    const mapKey = (field) => {
      const found = keys.find(
        (k) => k.toLowerCase().trim() === field.toLowerCase().trim()
      );
      return found ? row[found] : undefined;
    };

    student.studentId = mapKey('studentId')?.toString().trim() || '';
    student.fullName = mapKey('fullName')?.toString().trim() || '';
    student.email = mapKey('email')?.toString().trim() || '';
    student.gender = mapKey('gender')?.toString().trim() || '';
    student.dateOfBirth = mapKey('dateOfBirth') || null;
    student.department = mapKey('department')?.toString().trim() || '';
    student.class = mapKey('class')?.toString().trim() || '';
    student.admissionYear = parseInt(mapKey('admissionYear'), 10) || null;
    student.academicYear = mapKey('academicYear')?.toString().trim() || '';

    return student;
  });

  return mappedData.filter((s) => s.studentId && s.email);
};