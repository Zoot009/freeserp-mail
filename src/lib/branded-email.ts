// Pure, dependency-free email branding renderer. No server-only imports, so it
// can be used both at send time (server) and for live preview (client).

export interface BrandingView {
  brandName: string;
  logoUrl: string;
  brandColor: string;
  senderName: string;
  footerText: string;
  address: string;
  unsubscribeText: string;
  socialInstagram: string;
  socialX: string;
  socialLinkedin: string;
}

export const DEFAULT_BRANDING: BrandingView = {
  brandName: "",
  logoUrl: "",
  brandColor: "#4f46e5",
  senderName: "",
  footerText: "",
  address: "",
  unsubscribeText: "You're receiving this because you signed up.",
  socialInstagram: "",
  socialX: "",
  socialLinkedin: "",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Wraps an email's inner content in the project's branded shell (logo header,
 * accent color, footer with social + unsubscribe). If `content` is already a
 * full HTML document (contains <html), it's returned untouched so legacy
 * full-doc templates still work.
 */
export function renderBrandedEmail(
  content: string,
  branding: BrandingView,
  ctx: { unsubscribeUrl: string }
): string {
  if (/<html[\s>]/i.test(content)) return content;

  const color = branding.brandColor || "#4f46e5";
  const header = branding.logoUrl
    ? `<img src="${esc(branding.logoUrl)}" alt="${esc(branding.brandName || "logo")}" style="max-height:36px" />`
    : branding.brandName
      ? `<span style="font-size:18px;font-weight:700;color:${color}">${esc(branding.brandName)}</span>`
      : "";

  const socials: string[] = [];
  if (branding.socialInstagram) socials.push(`<a href="${esc(branding.socialInstagram)}" style="color:#94a3b8;text-decoration:none;margin:0 6px">Instagram</a>`);
  if (branding.socialX) socials.push(`<a href="${esc(branding.socialX)}" style="color:#94a3b8;text-decoration:none;margin:0 6px">X</a>`);
  if (branding.socialLinkedin) socials.push(`<a href="${esc(branding.socialLinkedin)}" style="color:#94a3b8;text-decoration:none;margin:0 6px">LinkedIn</a>`);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <div style="height:4px;background:${color};border-radius:4px 4px 0 0"></div>
      <div style="background:#ffffff;border:1px solid #e6e8eb;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
        ${header ? `<div style="padding:20px 28px;border-bottom:1px solid #eef0f3">${header}</div>` : ""}
        <div style="padding:28px">${content}</div>
        <div style="padding:20px 28px;border-top:1px solid #eef0f3;color:#94a3b8;font-size:12px;line-height:1.6">
          ${branding.footerText ? `<div style="margin-bottom:8px">${esc(branding.footerText)}</div>` : ""}
          ${socials.length ? `<div style="margin-bottom:8px">${socials.join("")}</div>` : ""}
          ${branding.address ? `<div style="margin-bottom:8px">${esc(branding.address)}</div>` : ""}
          <div>${esc(branding.unsubscribeText)} <a href="${esc(ctx.unsubscribeUrl)}" style="color:${color}">Unsubscribe</a>.</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
