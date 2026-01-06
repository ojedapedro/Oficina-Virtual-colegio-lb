/* 
   INSTRUCTIONS:
   1. Paste this into your Google Apps Script project.
   2. Ensure SPREADSHEET_ID matches your sheet: 13pCWr4GvNgysOCddPLhkgsj6iVNwfbrE9JyAJIJPhgs
   3. Run the 'setupSheets' function once to create the necessary 'Debts', 'Students' and 'Users' sheets.
   4. Create a Time-driven trigger for 'checkOverdueDebts' to run daily.
   5. Deploy as Web App (New Deployment -> Version: New).
*/

const SPREADSHEET_ID = '13pCWr4GvNgysOCddPLhkgsj6iVNwfbrE9JyAJIJPhgs';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e.parameter;
    const postData = JSON.parse(params.data || e.postData.contents || '{}');
    const action = params.action;
    let result;

    switch (action) {
      case 'registerPayment':
        result = registerPayment(postData);
        break;
      case 'getDebts':
        result = getDebts(postData.matricula);
        break;
      case 'getReport':
        result = generateReport(postData);
        break;
      case 'register':
        result = registerUser(postData);
        break;
      case 'login':
        result = loginUser(postData);
        break;
      default:
        result = { success: false, message: "Acción desconocida" };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- SETUP ---

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Payments Sheet
  let paySheet = ss.getSheetByName('Payments');
  if (!paySheet) {
    paySheet = ss.insertSheet('Payments');
    // Headers matching the user's image structure
    paySheet.appendRow([
      'paymentId', 
      'timestamp', 
      'registrationDate', 
      'paymentDate', 
      'representativeCi', 
      'studentId', // Used for Name in sample data
      'month', 
      'year', 
      'paymentMethod', 
      'reference', 
      'amount', 
      'status', 
      'observations', 
      'representativeName', 
      'matricula'
    ]);
  }

  // 2. Debts Sheet (Control de Mensualidades)
  let debtSheet = ss.getSheetByName('Debts');
  if (!debtSheet) {
    debtSheet = ss.insertSheet('Debts');
    debtSheet.appendRow(['Matrícula', 'Mes/Concepto', 'Monto', 'Estatus', 'Fecha Vencimiento']);
    // Example data
    debtSheet.appendRow(['2024-001', 'Septiembre', 150, 'Pagado', '2024-09-05']);
    debtSheet.appendRow(['2024-001', 'Octubre', 150, 'Pendiente', '2024-10-05']);
  }

  // 3. Students Sheet (For notifications)
  let studSheet = ss.getSheetByName('Students');
  if (!studSheet) {
    studSheet = ss.insertSheet('Students');
    studSheet.appendRow(['Matrícula', 'Nombre Estudiante', 'Nombre Representante', 'Email Representante']);
  }

  // 4. Users Sheet (Authentication)
  let userSheet = ss.getSheetByName('Users');
  if (!userSheet) {
    userSheet = ss.insertSheet('Users');
    // Updated Schema: Cedula instead of Email
    userSheet.appendRow(['Cedula', 'PasswordHash', 'Name', 'Role', 'CreatedDate']);
  }
}

// --- AUTH FUNCTIONS ---

function registerUser(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  
  // Check if Cedula exists
  const existingUsers = sheet.getDataRange().getValues();
  for (let i = 1; i < existingUsers.length; i++) {
    // Check column 0 (Cedula)
    if (String(existingUsers[i][0]) === String(data.cedula)) {
      return { success: false, message: 'La cédula ya está registrada.' };
    }
  }
  
  const passwordHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, data.password));

  sheet.appendRow([
    data.cedula,
    passwordHash,
    data.name,
    'Representative', // Default role
    new Date()
  ]);

  return { success: true, user: { cedula: data.cedula, name: data.name } };
}

function loginUser(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const users = sheet.getDataRange().getValues();
  
  const inputHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, data.password));

  for (let i = 1; i < users.length; i++) {
    const dbCedula = String(users[i][0]);
    const dbHash = users[i][1];
    const dbName = users[i][2];
    
    if (dbCedula === String(data.cedula) && dbHash == inputHash) {
      return { 
        success: true, 
        user: { 
          cedula: dbCedula, 
          name: dbName,
          role: users[i][3]
        } 
      };
    }
  }
  
  return { success: false, message: 'Cédula o contraseña incorrectos.' };
}

// --- PAYMENT FUNCTIONS ---

function registerPayment(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Payments');
  
  // Construct the row to match the exact order of columns A -> O in the user's image
  // 1. paymentId (A)
  // 2. timestamp (B)
  // 3. registrationDate (C)
  // 4. paymentDate (D)
  // 5. representativeCi (E)
  // 6. studentId (F) - Mapped to Student Name
  // 7. month (G) - Mapped to Paid Months (Comma separated)
  // 8. year (H) - Mapped to School Year
  // 9. paymentMethod (I)
  // 10. reference (J)
  // 11. amount (K)
  // 12. status (L)
  // 13. observations (M)
  // 14. representativeName (N)
  // 15. matricula (O)

  const monthsStr = Array.isArray(data.paidMonths) ? data.paidMonths.join(', ') : data.paidMonths;

  sheet.appendRow([
    data.id,
    new Date(),
    data.registrationDate,
    data.paymentDate,
    data.representativeId,
    data.studentName, 
    monthsStr,
    data.schoolYear,
    data.paymentMethod,
    data.referenceNumber,
    data.amount,
    'Pendiente', // Default status
    data.description || '',
    data.representativeName || '',
    data.studentMatricula
  ]);

  // Optional: Send email
  const email = getRepresentativeEmail(data.studentMatricula);
  if (email) {
    sendPaymentNotification(email, data);
  }

  return { success: true, message: 'Pago registrado correctamente', id: data.id };
}

function getDebts(matricula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Debts');
  const data = sheet.getDataRange().getValues();
  
  const debts = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(matricula)) {
      debts.push({
        month: data[i][1],
        amount: Number(data[i][2]),
        status: data[i][3],
        dueDate: data[i][4]
      });
    }
  }
  
  return { success: true, data: debts };
}

function generateReport(filters) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Payments');
  const data = sheet.getDataRange().getValues();
  
  let totalAmount = 0;
  let count = 0;
  const breakdownMap = {};

  const monthsMap = {
    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
  };

  let filterMonth = null;
  let filterStartDate = null;
  let filterEndDate = null;

  if (filters.startDate && filters.endDate) {
      // Create timestamps for comparison.
      // Assumes inputs are YYYY-MM-DD. 
      // Using simple string comparison for YYYY-MM-DD is often safer in GAS than Date objects due to timezone defaults,
      // but let's stick to Date objects for flexibility.
      // Note: new Date('YYYY-MM-DD') is usually UTC midnight.
      filterStartDate = new Date(filters.startDate).getTime();
      filterEndDate = new Date(filters.endDate).getTime();
  } else if (filters.month) {
    if (monthsMap[filters.month]) {
      filterMonth = monthsMap[filters.month];
    } else {
      filterMonth = parseInt(filters.month);
    }
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Col D is paymentDate (Index 3).
    // Ensure we handle both String and Date Object formats from the sheet.
    let payDateRaw = row[3];
    let payDateObj;
    
    if (typeof payDateRaw === 'string') {
        // Force replace - with / if needed, but ISO usually works. 
        // new Date('2024-05-20') work.
        payDateObj = new Date(payDateRaw);
    } else {
        payDateObj = new Date(payDateRaw);
    }

    const payMonth = payDateObj.getMonth() + 1; 
    const payTime = payDateObj.getTime();
    
    // Col I is paymentMethod (Index 8)
    const method = row[8];
    // Col K is amount (Index 10)
    const amount = Number(row[10]);
    // Col G is paidMonths (Index 6)
    const paidMonthsStr = String(row[6]);

    let match = true;

    if (filterStartDate && filterEndDate) {
        // Inclusive range check. 
        // Note: payDateObj is likely UTC midnight if created from YYYY-MM-DD string.
        // filterEndDate is also UTC midnight from YYYY-MM-DD string.
        // So <= should work for the exact end date.
        if (payTime < filterStartDate || payTime > filterEndDate) {
             match = false;
        }
    } else if (filterMonth && payMonth !== filterMonth) {
       match = false;
    }

    if (filters.paymentMethod && method !== filters.paymentMethod) match = false;
    // Level filtering is disabled as the column is not explicitly available in the new sheet structure.

    if (match) {
      totalAmount += amount;
      count++;
      // If filtering by method, group by paidMonths (or part thereof) to show some detail, otherwise by method.
      const key = filters.paymentMethod ? paidMonthsStr : method; 
      breakdownMap[key] = (breakdownMap[key] || 0) + amount;
    }
  }

  const breakdown = Object.keys(breakdownMap).map(key => ({
    category: key,
    amount: breakdownMap[key]
  }));

  return { success: true, data: { totalAmount, count, breakdown } };
}

// --- NOTIFICATIONS ---

function getRepresentativeEmail(matricula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Students');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(matricula)) {
      return data[i][3]; 
    }
  }
  return null;
}

function sendPaymentNotification(email, data) {
  const subject = `Confirmación de Pago - Colegio LB - ${data.id}`;
  const body = `Estimado Representante, hemos recibido su registro de pago exitosamente (ID: ${data.id}).`;
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    console.log("Error sending email: " + e.toString());
  }
}

function checkOverdueDebts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const debtSheet = ss.getSheetByName('Debts');
  const debtData = debtSheet.getDataRange().getValues();
  const today = new Date();
  
  for (let i = 1; i < debtData.length; i++) {
    const matricula = debtData[i][0];
    const concepto = debtData[i][1];
    const status = debtData[i][3];
    const dueDate = new Date(debtData[i][4]);
    
    if (status === 'Pendiente' && dueDate < today) {
      if (status !== 'Vencido') {
         debtSheet.getRange(i + 1, 4).setValue('Vencido');
      }
      const email = getRepresentativeEmail(matricula);
      if (email) {
        MailApp.sendEmail(email, `Pago Vencido - ${concepto}`, `El pago de ${concepto} está vencido.`);
      }
    }
  }
}