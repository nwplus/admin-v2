import { Link } from "@tanstack/react-router";

const PAGES = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Livesites",
    href: "/livesites",
    children: [
      {
        label: "HackCamp",
        href: "/livesites/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/livesites/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/livesites/cmdf",
      },
      {
        label: "www",
        href: "/livesites/www",
      },
    ],
  },
  {
    label: "FAQ",
    href: "/faq",
  },
  {
    label: "Hackathons",
    href: "/hackathons",
    children: [
      {
        label: "HackCamp",
        href: "/hackathons/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/hackathons/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/hackathons/www",
      },
    ],
  },
  {
    label: "Applications",
    href: "/applications",
    children: [
      {
        label: "HackCamp",
        href: "/applications/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/applications/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/applications/cmdf",
      },
    ],
  },
  {
    label: "Evaluator",
    href: "/evaluator",
  },
  {
    label: "Factotum",
    href: "/factotum",
  },
];

export function Navigation() {
  return (
    <nav className="h-full w-64 bg-card">
      <ul className="space-y-2">
        {PAGES.map((page) => (
          <li key={page.label}>
            {page.children ? (
              <div className="block cursor-default rounded-md px-3 py-2 font-medium text-muted-foreground text-sm">
                {page.label}
              </div>
            ) : (
              <Link
                to={page.href}
                className="block rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                activeProps={{
                  className: "bg-primary text-primary-foreground",
                }}
              >
                {page.label}
              </Link>
            )}
            {page.children && (
              <ul className="mt-2 ml-4 space-y-1">
                {page.children.map((child) => (
                  <li key={child.label}>
                    <Link
                      to={child.href}
                      className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
