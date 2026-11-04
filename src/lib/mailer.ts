
import "server-only";

import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure:
    process.env.SMTP_SECURE === "true" || smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type ConfirmationEmailData = {
  patientName: string;
  patientEmail: string;
  bloodGroup: string;
  units: number;
  bloodBankName: string;
  hospitalName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  state: string;
  requestId: string;
  response?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBloodGroup(value: string): string {
  return value
    .replace("_POSITIVE", "+")
    .replace("_NEGATIVE", "-");
}

export async function sendBloodRequestConfirmationEmail(
  data: ConfirmationEmailData
) {
  const {
    patientName,
    patientEmail,
    bloodGroup,
    units,
    bloodBankName,
    hospitalName,
    phone,
    address,
    city,
    district,
    state,
    requestId,
    response,
  } = data;

  const safe = {
    patientName: escapeHtml(patientName),
    bloodBankName: escapeHtml(bloodBankName),
    hospitalName: escapeHtml(hospitalName),
    phone: escapeHtml(phone),
    address: escapeHtml(address),
    city: escapeHtml(city),
    district: escapeHtml(district),
    state: escapeHtml(state),
    requestId: escapeHtml(requestId),
    response: escapeHtml(response || ""),
    bloodGroup: escapeHtml(formatBloodGroup(bloodGroup)),
    units: escapeHtml(units),
  };

  const location = [
    address,
    city,
    district,
    state,
  ]
    .filter(Boolean)
    .join(", ");

  const safeLocation = escapeHtml(location);

  const subject = `Blood Request Confirmed | Life Bridge | ${formatBloodGroup(
    bloodGroup
  )}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blood Request Confirmed - Life Bridge</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f4f5f7;
  font-family:Arial,Helvetica,sans-serif;
  color:#252525;
">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f4f5f7;padding:35px 12px;">

    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="
            width:100%;
            max-width:600px;
            background-color:#ffffff;
            border-radius:12px;
            overflow:hidden;
          ">

          <!-- BRAND HEADER -->
          <tr>
            <td style="
              background-color:#b91c1c;
              padding:28px 32px;
              text-align:center;
            ">

              <div style="
                color:#ffffff;
                font-size:28px;
                font-weight:800;
                letter-spacing:-1px;
              ">
                Life<span style="color:#fecaca;">Bridge</span>
              </div>

              <p style="
                margin:8px 0 0;
                color:#fee2e2;
                font-size:11px;
                letter-spacing:2px;
                text-transform:uppercase;
              ">
                The Network Behind Every Lifeline
              </p>

            </td>
          </tr>

          <!-- SUCCESS SECTION -->
          <tr>
            <td style="padding:35px 32px 20px;text-align:center;">

              <div style="
                width:58px;
                height:58px;
                line-height:58px;
                margin:0 auto 18px;
                border-radius:50%;
                background-color:#dcfce7;
                color:#15803d;
                font-size:30px;
                font-weight:bold;
              ">
                &#10003;
              </div>

              <h1 style="
                margin:0;
                color:#171717;
                font-size:25px;
                line-height:1.3;
              ">
                Blood Request Confirmed
              </h1>

              <p style="
                margin:12px 0 0;
                color:#666666;
                font-size:14px;
                line-height:1.7;
              ">
                Your blood request has been confirmed by the
                blood bank. Please find the confirmation details below.
              </p>

            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:12px 32px 20px;">

              <p style="
                margin:0;
                font-size:15px;
                line-height:1.7;
                color:#333333;
              ">
                Dear <strong>${safe.patientName}</strong>,
              </p>

              <p style="
                margin:10px 0 0;
                font-size:14px;
                line-height:1.8;
                color:#666666;
              ">
                We are pleased to inform you that the blood bank
                has confirmed your request through Life Bridge.
                Please contact the blood bank directly to coordinate
                the next steps.
              </p>

            </td>
          </tr>

          <!-- BLOOD DETAILS -->
          <tr>
            <td style="padding:0 32px 22px;">

              <table width="100%" cellpadding="0" cellspacing="0"
                style="
                  background-color:#fff7f7;
                  border:1px solid #fecaca;
                  border-radius:10px;
                ">

                <tr>
                  <td style="padding:20px;">

                    <p style="
                      margin:0 0 16px;
                      color:#991b1b;
                      font-size:12px;
                      font-weight:bold;
                      letter-spacing:1px;
                      text-transform:uppercase;
                    ">
                      YOUR BLOOD REQUEST
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">

                      <tr>
                        <td style="padding:8px 0;color:#777;font-size:13px;">
                          Blood Group
                        </td>
                        <td align="right" style="
                          padding:8px 0;
                          color:#b91c1c;
                          font-size:20px;
                          font-weight:bold;
                        ">
                          ${safe.bloodGroup}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;color:#777;font-size:13px;">
                          Required Units
                        </td>
                        <td align="right" style="
                          padding:8px 0;
                          color:#222;
                          font-size:14px;
                          font-weight:bold;
                        ">
                          ${safe.units} Units
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0;color:#777;font-size:13px;">
                          Request Status
                        </td>
                        <td align="right" style="
                          padding:8px 0;
                          color:#15803d;
                          font-size:13px;
                          font-weight:bold;
                        ">
                          CONFIRMED
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BLOOD BANK DETAILS -->
          <tr>
            <td style="padding:0 32px 22px;">

              <h2 style="
                margin:0 0 15px;
                font-size:17px;
                color:#222222;
              ">
                Blood Bank Information
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0"
                style="
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                ">

                <tr>
                  <td style="padding:18px;">

                    <p style="
                      margin:0;
                      font-size:17px;
                      font-weight:bold;
                      color:#222222;
                    ">
                      ${safe.bloodBankName}
                    </p>

                    <p style="
                      margin:6px 0 0;
                      font-size:13px;
                      color:#777777;
                    ">
                      ${safe.hospitalName}
                    </p>

                    <div style="
                      margin-top:16px;
                      border-top:1px solid #eeeeee;
                      padding-top:14px;
                    ">

                      <p style="
                        margin:0;
                        color:#777777;
                        font-size:12px;
                      ">
                        ADDRESS
                      </p>

                      <p style="
                        margin:5px 0 0;
                        color:#333333;
                        font-size:13px;
                        line-height:1.7;
                      ">
                        ${safeLocation}
                      </p>

                      <p style="
                        margin:16px 0 0;
                        color:#777777;
                        font-size:12px;
                      ">
                        CONTACT NUMBER
                      </p>

                      <p style="
                        margin:5px 0 0;
                        font-size:15px;
                        font-weight:bold;
                        color:#b91c1c;
                      ">
                        ${safe.phone}
                      </p>

                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- HOSPITAL RESPONSE -->
          ${
            response
              ? `
          <tr>
            <td style="padding:0 32px 22px;">

              <div style="
                background-color:#f8fafc;
                border-left:4px solid #b91c1c;
                padding:16px;
              ">

                <p style="
                  margin:0 0 8px;
                  font-size:12px;
                  font-weight:bold;
                  color:#555555;
                  text-transform:uppercase;
                ">
                  Message from the Blood Bank
                </p>

                <p style="
                  margin:0;
                  color:#444444;
                  font-size:14px;
                  line-height:1.7;
                ">
                  ${safe.response}
                </p>

              </div>

            </td>
          </tr>
          `
              : ""
          }

          <!-- REFERENCE -->
          <tr>
            <td style="padding:0 32px 25px;">

              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f8fafc;border-radius:8px;">

                <tr>
                  <td style="padding:16px;">

                    <p style="
                      margin:0;
                      color:#888888;
                      font-size:11px;
                      letter-spacing:1px;
                      text-transform:uppercase;
                    ">
                      REQUEST REFERENCE ID
                    </p>

                    <p style="
                      margin:7px 0 0;
                      color:#222222;
                      font-size:13px;
                      font-weight:bold;
                      word-break:break-all;
                    ">
                      ${safe.requestId}
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- IMPORTANT NOTICE -->
          <tr>
            <td style="
              padding:0 32px 30px;
              color:#777777;
              font-size:12px;
              line-height:1.7;
            ">

              <strong style="color:#444444;">
                Important:
              </strong>

              Please contact the blood bank before travelling
              to confirm current stock, collection arrangements,
              eligibility and clinical compatibility.
              A confirmation does not replace medical advice
              or professional cross-matching.

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background-color:#202020;
              padding:25px 25px;
              text-align:center;
            ">

              <p style="
                margin:0;
                color:#ffffff;
                font-size:16px;
                font-weight:bold;
              ">
                Life Bridge
              </p>

              <p style="
                margin:8px 0 0;
                color:#bbbbbb;
                font-size:11px;
                line-height:1.7;
              ">
                The Network Behind Every Lifeline.
                <br>
                Connecting people. Supporting lives.
              </p>

              <div style="
                height:1px;
                background-color:#444444;
                margin:18px 0;
              "></div>

              <p style="
                margin:0;
                color:#999999;
                font-size:10px;
                line-height:1.7;
              ">
                This is an automated email from Life Bridge.
                Please do not reply directly to this message.
                <br>
                © ${new Date().getFullYear()} Life Bridge. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  const text = `
LIFE BRIDGE
The Network Behind Every Lifeline

BLOOD REQUEST CONFIRMED

Dear ${patientName},

Your blood request has been confirmed by the blood bank.

REQUEST DETAILS
Blood Group: ${formatBloodGroup(bloodGroup)}
Units: ${units}
Status: CONFIRMED
Request ID: ${requestId}

BLOOD BANK INFORMATION
Blood Bank: ${bloodBankName}
Hospital: ${hospitalName}
Address: ${location}
Contact: ${phone}

${response ? `MESSAGE FROM BLOOD BANK:\n${response}\n` : ""}

Please contact the blood bank before travelling to confirm
current stock, collection arrangements and clinical compatibility.

Life Bridge
The Network Behind Every Lifeline.

This is an automated email. Please do not reply directly.
`;

  const fromName = process.env.SMTP_FROM_NAME || "Life Bridge";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP email configuration is incomplete.");
  }

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: patientEmail,
    subject,
    text,
    html,
  });
}
