import { store } from "@/config/store";

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {store.instagram && (
        <a href={store.instagram} target="_blank" rel="noopener noreferrer" aria-label="NOVASTORE en Instagram"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-ink-300 transition hover:border-white hover:text-white">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
      )}
      {store.tiktok && (
        <a href={store.tiktok} target="_blank" rel="noopener noreferrer" aria-label="NOVASTORE en TikTok"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-ink-300 transition hover:border-white hover:text-white">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.2v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.6a5.8 5.8 0 1 0 5 5.8V9a7.4 7.4 0 0 0 4.3 1.4V7.2a4.3 4.3 0 0 1-3.2-1.4z"/></svg>
        </a>
      )}
    </div>
  );
}
