import "server-only";

export type ContactRequest = { name: string; email: string; phone: string; message: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Checks and trims the raw form body. `null` = a required field is missing or invalid; "spam" = the honeypot was filled.
export function parseContact(body: Record<string, unknown>): ContactRequest | "spam" | null {
  const str = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  if (str("website", 100)) return "spam";
  const req = { name: str("name", 100), email: str("email", 150), phone: str("phone", 40), message: str("message", 3000) };
  if (req.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email) || req.message.length < 5 || body.consent !== true) return null;
  return req;
}

// Emails the request to the sales inbox via Resend; without RESEND_API_KEY/CONTACT_TO it only logs. Returns false if sending failed.
export async function sendContact({ name, email, phone, message }: ContactRequest): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO;
  if (!key || !to) {
    console.log("[contact] (no RESEND_API_KEY/CONTACT_TO set – not emailed)", { name, email, phone, message });
    return true;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "Б&Б Уникооп <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `Ново барање од ${name}`,
      html: `<p><b>Име:</b> ${esc(name)}<br><b>Е-пошта:</b> ${esc(email)}<br><b>Телефон:</b> ${esc(phone) || "-"}</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`,
    }),
  });
  return r.ok;
}
