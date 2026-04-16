const footerLinks = [
  { label: "Programs", href: "#programs" },
  { label: "Coaches", href: "#coaches" },
  { label: "Membership", href: "#membership" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-page-bg py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 md:flex-row md:justify-between lg:px-8">
        {/* Logo */}
        <a href="#" className="flex flex-col leading-none">
          <span className="font-display text-[18px] font-black uppercase tracking-tight text-white">
            CONTINENTAL
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-text-secondary">
            FITNESS GYM
          </span>
        </a>

        {/* Nav */}
        <nav className="flex gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[12px] font-medium uppercase tracking-[0.1em] text-text-secondary transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-[12px] text-text-muted">
          &copy; 2026 Continental Fitness Gym. Davao City.
        </p>
      </div>
    </footer>
  );
}
