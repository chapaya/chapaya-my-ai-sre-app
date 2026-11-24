// A Server Component: it has no state, so it's rendered to plain HTML
// and sends no JavaScript to the browser.

import { LINK_GROUPS } from "@/config";

export function QuickLinks() {
  return (
    <section aria-labelledby="links-title">
      <h2 id="links-title" className="mb-3 text-lg font-bold">
        Where to look
      </h2>

      {LINK_GROUPS.map((group) => (
        <div key={group.name} className="mb-5">
          <h3 className="mb-1.5 text-[0.9375rem] font-medium text-muted">{group.name}</h3>
          <ul>
            {group.links.map((link) => (
              <li key={link.label}>
                {link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-b border-rule py-1.5 font-bold hover:text-ok"
                  >
                    {link.label}
                  </a>
                ) : (
                  <span className="block border-b border-dashed border-rule py-1.5 text-muted">
                    {link.label}: add its URL in src/config.ts
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
