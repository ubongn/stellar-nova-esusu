/**
 * Google Apps Script — Nova Esusu Feedback Collector
 *
 * SETUP:
 * 1. Go to https://sheets.google.com → create new blank spreadsheet
 * 2. Name it "Nova Esusu Feedback"
 * 3. Go to Extensions → Apps Script
 * 4. Delete all code, paste this entire file
 * 5. Click 💾 Save
 * 6. Click ▶️ Run → select "doPost" → click Run → authorize when prompted
 * 7. Click Deploy → New Deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy → copy the URL
 * 8. Give me the URL and I'll wire it into the frontend
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Responses");
    if (!sheet) {
      sheet = ss.insertSheet("Responses");
      sheet.appendRow(["Timestamp", "Name", "Role", "Rating", "Experience", "Feature Request"]);
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 180);
      sheet.setColumnWidth(2, 150);
      sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(4, 80);
      sheet.setColumnWidth(5, 400);
      sheet.setColumnWidth(6, 300);
    }

    sheet.appendRow([
      new Date().toISOString(),
      data.name || "(anonymous)",
      data.role || "user",
      data.rating || "",
      data.experience || "",
      data.featureRequest || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "Nova Esusu Feedback API" })
  ).setMimeType(ContentService.MimeType.JSON);
}
