import { NextResponse } from "next/server";

// Unknown /api/* paths answer in JSON like the real endpoints, not with the HTML 404 page.
function notFound() {
  return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
}

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };
