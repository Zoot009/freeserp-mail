import Handlebars from "handlebars";

// Compile+render a Handlebars template with a plain-object context.
// Used for email subject/body so authors can write {{ firstName }} etc.
// Missing variables render as empty strings (Handlebars default).

export function render(source: string, context: Record<string, unknown>): string {
  const template = Handlebars.compile(source, { noEscape: false });
  return template(context);
}

// Subject lines should never HTML-escape.
export function renderPlain(
  source: string,
  context: Record<string, unknown>
): string {
  const template = Handlebars.compile(source, { noEscape: true });
  return template(context);
}
