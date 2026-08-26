import nodemailer from "nodemailer";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} missing`);
  return value;
}

export async function sendVerificationEmail({
  email,
  code,
  purpose,
}: {
  email: string;
  code: string;
  purpose: "register" | "reset_password";
}) {
  const isRegistration = purpose === "register";
  const from = process.env.EMAIL_FROM?.trim() || "member@sjsia.org";
  const subject = isRegistration ? "SJSIA 團體會員註冊驗證碼" : "SJSIA 會員密碼重設驗證碼";
  const text = `您的驗證碼是 ${code}，10 分鐘內有效。若非本人操作，請忽略此信。`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#171717">
    <p style="font-size:13px;font-weight:700;color:#64748b">SJSIA MEMBER PORTAL</p>
    <h1 style="font-size:24px">${isRegistration ? "團體會員註冊驗證" : "重設會員密碼"}</h1>
    <p>請在會員系統輸入以下 6 位數驗證碼：</p>
    <div style="margin:24px 0;padding:18px;border-radius:12px;background:#f1f5f9;font-size:32px;font-weight:800;letter-spacing:8px;text-align:center">${code}</div>
    <p style="color:#64748b">驗證碼將於 10 分鐘後失效。若非本人操作，請忽略此信。</p>
  </div>`;

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `盛家運動健康產業協會 <${from}>`,
        to: [email],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = (await response.text()).slice(0, 500);
      throw new Error(`Resend API failed (${response.status}): ${body}`);
    }
    return;
  }

  const host = required("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || "587");
  const user = required("SMTP_USER");
  const pass = required("SMTP_PASS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: `盛家運動健康產業協會 <${from}>`,
    to: email,
    subject,
    text,
    html,
  });
}
