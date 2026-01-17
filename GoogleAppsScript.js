/* 
   INSTRUCTIONS:
   1. Paste this into your Google Apps Script project.
   2. Ensure SPREADSHEET_ID matches your sheet: 13pCWr4GvNgysOCddPLhkgsj6iVNwfbrE9JyAJIJPhgs
   3. Run the 'setupSheets' function once to create the necessary 'Debts', 'Students' and 'Users' sheets.
   4. Create a Time-driven trigger for 'checkOverdueDebts' to run daily.
   5. Deploy as Web App (New Deployment -> Version: New).
*/

const SPREADSHEET_ID = '13pCWr4GvNgysOCddPLhkgsj6iVNwfbrE9JyAJIJPhgs';

function doGet(e) {
  return ContentService.createTextOutput("La API de la Oficina Virtual está activa. Por favor utilice peticiones POST desde la aplicación.");
}

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
      case 'getExchangeRate':
        result = getExchangeRate();
        break;
      case 'getStudentByCedula':
        result = getStudentByCedula(postData.cedula);
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
    paySheet.appendRow([
      'paymentId',            // A
      'timestamp',            // B
      'registrationDate',     // C
      'paymentDate',          // D
      'representativeCedula', // E
      'studentId',            // F
      'month',                // G
      'year',                 // H
      'paymentMethod',        // I
      'reference',            // J
      'amount$',              // K
      'amountBs',             // L
      'status',               // M
      'observations',         // N
      'representativeName',   // O
      'matricula',            // P
      'paymentForm'           // Q
    ]);
  }
}

// --- AUTH FUNCTIONS ---

function registerUser(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  
  if (!sheet) return { success: false, message: 'Hoja Users no encontrada' };

  const existingUsers = sheet.getDataRange().getValues();
  for (let i = 1; i < existingUsers.length; i++) {
    if (String(existingUsers[i][0]) === String(data.cedula)) {
      return { success: false, message: 'La cédula ya está registrada.' };
    }
  }
  
  const passwordHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, data.password));

  sheet.appendRow([
    data.cedula,
    passwordHash,
    data.name,
    'Representative',
    new Date()
  ]);

  return { success: true, user: { cedula: data.cedula, name: data.name } };
}

function loginUser(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  
  if (!sheet) {
    // Fallback simple si no hay sistema de usuarios, permitir entrada genérica o fallar
    return { success: false, message: 'Sistema de usuarios no configurado.' };
  }

  const users = sheet.getDataRange().getValues();
  const inputHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, data.password));

  for (let i = 1; i < users.length; i++) {
    const dbCedula = String(users[i][0]);
    const dbHash = users[i][1];
    const dbName = users[i][2];
    
    if (dbCedula === String(data.cedula) && dbHash == inputHash) {
      return { 
        success: true, 
        user: { cedula: dbCedula, name: dbName, role: users[i][3] } 
      };
    }
  }
  
  return { success: false, message: 'Cédula o contraseña incorrectos.' };
}

// --- DATA FUNCTIONS ---

function getStudentByCedula(cedula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Students');
  if (!sheet) return { success: false, message: 'Hoja Students no encontrada' };
  
  const data = sheet.getDataRange().getValues();
  const students = [];
  
  // Basado en tu imagen:
  // Col A (0): studentId (Matrícula)
  // Col B (1): representativeCedula
  // Col C (2): name (Nombre Alumno)
  
  for (let i = 1; i < data.length; i++) {
    const repCedula = String(data[i][1]); // Col B
    
    if (repCedula === String(cedula)) {
      students.push({
        matricula: data[i][0],    // Col A: studentId
        studentName: data[i][2]   // Col C: name
      });
    }
  }
  
  if (students.length > 0) {
    return { success: true, students: students };
  }
  
  return { success: false, message: "No se encontraron estudiantes asociados a esta cédula." };
}

// --- PAYMENT FUNCTIONS ---

function registerPayment(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Payments');
  
  const monthsStr = Array.isArray(data.paidMonths) ? data.paidMonths.join(', ') : data.paidMonths;

  sheet.appendRow([
    data.id,                     // A
    new Date(),                  // B
    data.registrationDate,       // C
    data.paymentDate,            // D
    data.representativeCedula,   // E
    data.studentName,            // F
    monthsStr,                   // G
    data.schoolYear,             // H
    data.paymentMethod,          // I
    data.referenceNumber,        // J
    data.amountUSD,              // K
    data.amountBs,               // L
    'Pendiente',                 // M
    data.description || '',      // N
    data.representativeName || '', // O
    data.studentMatricula,       // P
    data.paymentForm             // Q
  ]);

  // Buscar email en la hoja Representatives usando la cédula
  const email = getRepresentativeEmail(data.representativeCedula);
  if (email) {
    sendPaymentNotification(email, data);
  }

  return { success: true, message: 'Pago registrado correctamente', id: data.id };
}

function getDebts(matricula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Debts');
  if (!sheet) return { success: true, data: [] };

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

function getExchangeRate() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Config');
  if (!sheet) {
     return { success: false, rate: 0, date: null };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, rate: 0, date: null };

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  // Find the row with the LATEST date
  let latestRate = 0;
  let latestDateObj = new Date(0); // Epoch time

  for (let i = 0; i < data.length; i++) {
    const rowRate = Number(data[i][0]);
    const rowDateRaw = data[i][1];
    
    let rowDate = new Date(rowDateRaw);
    
    if (!isNaN(rowDate.getTime())) {
      if (rowDate > latestDateObj) {
        latestDateObj = rowDate;
        latestRate = rowRate;
      }
    }
  }

  if (latestRate === 0 && data.length > 0) {
     const lastIdx = data.length - 1;
     latestRate = Number(data[lastIdx][0]);
     latestDateObj = new Date(data[lastIdx][1]);
  }

  return { success: true, rate: latestRate, date: latestDateObj.toISOString() };
}

function generateReport(filters) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Payments');
  if (!sheet) return { success: true, data: { totalAmount: 0, count: 0, breakdown: [] } };

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
    let payDateRaw = row[3];
    let payDateObj = new Date(payDateRaw);
    const payMonth = payDateObj.getMonth() + 1; 
    const payTime = payDateObj.getTime();
    
    const method = row[8];      
    const amount = Number(row[10]); 
    const paidMonthsStr = String(row[6]); 

    let match = true;

    if (filterStartDate && filterEndDate) {
        if (payTime < filterStartDate || payTime > filterEndDate) match = false;
    } else if (filterMonth && payMonth !== filterMonth) {
       match = false;
    }

    if (filters.paymentMethod && method !== filters.paymentMethod) match = false;

    if (match) {
      totalAmount += amount;
      count++;
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

function getRepresentativeEmail(cedula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Representatives'); // Buscar en hoja Representantes
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  
  // Basado en imagen: Col A (0): cedula, Col D (3): email
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(cedula)) {
      return data[i][3]; // Columna D
    }
  }
  return null;
}

function sendPaymentNotification(email, data) {
  const subject = `Confirmación de Pago - Colegio LB - ${data.id}`;
  const body = `Estimado Representante, hemos recibido su registro de pago exitosamente (ID: ${data.id}).
  
  Alumno: ${data.studentName}
  Matrícula: ${data.studentMatricula}
  Monto: $${data.amountUSD} / Bs. ${data.amountBs}
  Referencia: ${data.referenceNumber}
  
  Este es un mensaje automático.`;
  
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    console.log("Error sending email: " + e.toString());
  }
}