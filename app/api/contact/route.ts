import { NextResponse } from "next/server";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Невалидно барање." }, { status: 400 }); }
  const str = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  const name = str("name", 100), email = str("email", 150), phone = str("phone", 40), message = str("message", 3000);

  if (str("website", 100)) return NextResponse.json({ ok: true }); // honeypot
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5 || body.consent !== true)
    return NextResponse.json({ error: "Пополнете ги сите задолжителни полиња." }, { status: 422 });

  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO;
  if (key && to) {
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
    if (!r.ok) return NextResponse.json({ error: "Пораката не може да се испрати. Обидете се повторно." }, { status: 502 });
  } else {
    console.log("[contact] (no RESEND_API_KEY/CONTACT_TO set – not emailed)", { name, email, phone, message });
  }
  return NextResponse.json({ ok: true });
}
