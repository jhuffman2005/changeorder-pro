module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { co, project } = req.body;
  const approvalUrl = `${process.env.APP_URL}/approve/${co.id}`;
  const total = Number(co.totalCost || 0).toLocaleString();

  const errors = [];

  // ── EMAIL via Resend ────────────────────────────────────────────────────────
  try {
    const emailHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #0f0e0c;">
        <div style="background: #1c2b35; padding: 24px; border-bottom: 3px solid #e8a020;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔨 Change Order — Action Required</h1>
        </div>
        <div style="padding: 24px; background: #f5f0e8;">
          <p style="font-size: 16px;">Hi ${project.clientName.split(" ")[0]},</p>
          <p>Your contractor has submitted a change order for <strong>${project.name}</strong> that requires your approval.</p>

          <div style="background: white; border: 1px solid #d4cec4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin:0 0 8px 0;"><strong>Change Order:</strong> ${co.coNumber}</p>
            <p style="margin:0 0 8px 0;"><strong>Title:</strong> ${co.title}</p>
            <p style="margin:0 0 8px 0;"><strong>Amount:</strong> $${total}</p>
            <p style="margin:0 0 8px 0;"><strong>Schedule Impact:</strong> ${co.scheduleStatement}</p>
            <p style="margin:0;"><strong>Date:</strong> ${co.date}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${approvalUrl}" style="background: #e8a020; color: #0f0e0c; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Review & Approve Change Order →
            </a>
          </div>

          <p style="color: #8a8478; font-size: 13px;">This link takes you to a secure page where you can review the full details and sign electronically.</p>
        </div>
      </div>
    `;

    // Send to client
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_KEY}` },
      body: JSON.stringify({
        from: "ChangeOrder Pro <onboarding@resend.dev>",
        to: [project.clientEmail],
        subject: `Action Required: Change Order ${co.coNumber} — $${total} — ${project.name}`,
        html: emailHtml,
      })
    });
  } catch (err) {
    errors.push("Email failed: " + err.message);
  }

  // ── SMS via Twilio ──────────────────────────────────────────────────────────
  try {
    if (project.clientPhone) {
      const phone = project.clientPhone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;
      const smsBody = `Hi ${project.clientName.split(" ")[0]} — ${project.name} has a new change order (${co.coNumber}) for $${total} requiring your approval. Review & sign here: ${approvalUrl}`;

      const twilioAuth = Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString("base64");
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
        method: "POST",
        headers: { "Authorization": `Basic ${twilioAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: process.env.TWILIO_PHONE, To: formattedPhone, Body: smsBody }).toString()
      });
    }
  } catch (err) {
    errors.push("SMS failed: " + err.message);
  }

  res.status(200).json({ success: true, approvalUrl, errors });
};
