import { NextResponse } from "next/server";
import { parseContact, sendContact } from "@/server/contact";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Невалидно барање.", code: "invalid" }, { status: 400 }); }

  const contact = parseContact(body);
  if (contact === "spam") return NextResponse.json({ ok: true });
  if (!contact) return NextResponse.json({ error: "Пополнете ги сите задолжителни полиња.", code: "required" }, { status: 422 });
  if (!(await sendContact(contact))) return NextResponse.json({ error: "Пораката не може да се испрати. Обидете се повторно.", code: "send" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
