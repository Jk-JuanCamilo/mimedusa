export function setSeo(opts: {
  title: string;
  description: string;
  canonicalPath: string;
}) {
  if (typeof document === "undefined") return;

  document.title = opts.title;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", opts.description);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", `${window.location.origin}${opts.canonicalPath}`);
}
