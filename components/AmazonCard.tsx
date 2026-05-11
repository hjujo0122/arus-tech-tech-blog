export default function AmazonCard({ href, children }: { href: string; children?: React.ReactNode }) {
  const label = typeof children === "string" && children !== href ? children : "商品を見る";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-3 flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-card-bg px-5 py-4 no-underline transition-colors hover:border-[#FF9900]"
    >
      <span className="flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 shrink-0 text-[#FF9900]"
          aria-hidden="true"
        >
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.2 4H3a1 1 0 0 0 0 2h1.2l2.6 9.6c.2.6.7 1 1.3 1.1L18 17.6c.6.1 1.2-.3 1.4-.9l2-7c.2-.7-.3-1.4-1-1.4H7.6L6.8 5c-.1-.6-.6-1-1.2-1H5.2z" />
        </svg>
        <span className="font-medium text-foreground/90 group-hover:text-[#FF9900] transition-colors">
          {label}
        </span>
      </span>
      <span className="shrink-0 text-sm text-subtext group-hover:text-[#FF9900] transition-colors">
        Amazon で見る →
      </span>
    </a>
  );
}
