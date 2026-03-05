// Simple file-based storage using Vercel's tmp or just in-memory for now
// We'll use a global store — for production use Vercel KV or Supabase
const store = global._coStore || (global._coStore = {});

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    // Save CO + project data
    const { co, project } = req.body;
    store[co.id] = { co, project, savedAt: Date.now() };
    res.status(200).json({ success: true });

  } else if (req.method === "GET") {
    // Retrieve CO for approval page
    const record = store[id];
    if (!record) return res.status(404).json({ error: "Change order not found" });
    res.status(200).json(record);

  } else if (req.method === "PATCH") {
    // Mark as approved with signature
    const record = store[id];
    if (!record) return res.status(404).json({ error: "Not found" });
    record.co.status = "approved";
    record.co.signedBy = req.body.signedBy;
    record.co.signedAt = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    store[id] = record;

    // Send confirmation emails to both parties
    try {
      const { co, project } = record;
      const total = Number(co.totalCost || 0).toLocaleString();
      const confirmedHtml = (name) => `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2d7a4f; padding: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">✅ Change Order Approved</h1>
          </div>
          <div style="padding: 24px; background: #f5f0e8;">
            <p>Hi ${name},</p>
            <p><strong>${co.coNumber}</strong> — ${co.title} has been approved and signed.</p>
            <div style="background: white; border: 1px solid #d4cec4; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin:0 0 8px 0;"><strong>Project:</strong> ${project.name}</p>
              <p style="margin:0 0 8px 0;"><strong>Amount:</strong> $${total}</p>
              <p style="margin:0 0 8px 0;"><strong>Signed by:</strong> ${co.signedBy}</p>
              <p style="margin:0;"><strong>Signed on:</strong> ${co.signedAt}</p>
            </div>
            <p style="color: #8a8478; font-size: 13px;">This serves as your electronic record of approval. Keep this email for your records.</p>
          </div>
        </div>
      `;

      // Email client
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_KEY}` },
        body: JSON.stringify({
          from: "ChangeOrder Pro <onboarding@resend.dev>",
          to: [project.clientEmail],
          subject: `✅ Signed: Change Order ${co.coNumber} — ${project.name}`,
          html: confirmedHtml(project.clientName.split(" ")[0]),
        })
      });

      // Email GC
      if (project.gcEmail) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_KEY}` },
          body: JSON.stringify({
            from: "ChangeOrder Pro <onboarding@resend.dev>",
            to: [project.gcEmail],
            subject: `✅ Approved: Change Order ${co.coNumber} — ${project.name}`,
            html: confirmedHtml("there"),
          })
        });
      }
    } catch(err) {
      console.error("Confirmation email failed:", err);
    }

    res.status(200).json({ success: true, co: record.co });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};
