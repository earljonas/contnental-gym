import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-page-bg">
      {/* LEFT: Photo panel — hidden on mobile */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/gym1.jpg"
          alt="Continental Fitness Gym interior"
          fill
          className="object-cover"
          priority
          quality={80}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-page-bg" />

        {/* Centered branding */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Link href="/" className="flex flex-col items-center leading-none">
            <span className="font-display text-[52px] font-black uppercase tracking-tight text-white">
              CONTINENTAL
            </span>
            <span className="text-[14px] font-medium uppercase tracking-[0.3em] text-white/60">
              FITNESS GYM
            </span>
          </Link>
        </div>
      </div>

      {/* RIGHT: Form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Top bar — mobile logo + back link */}
        <div className="flex items-center justify-between px-6 py-5 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-[12px] uppercase tracking-[0.15em] text-text-secondary transition-colors hover:text-white lg:ml-auto"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to site
          </Link>
        </div>

        {/* Form content — vertically centered */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
