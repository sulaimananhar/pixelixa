import AppClient from "@/components/AppClient";
import FloatingReturnBadge from "@/components/FloatingReturnBadge";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-4 sm:p-6 lg:p-10">
      <main className="mx-auto max-w-4xl flex flex-col gap-6 sm:gap-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Pixelixa
            </h1>
            <p className="text-sm text-foreground/70">
              Upload selfie → Download pixel art
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <a
              href="https://github.com/berkinduz/pixelixa"
              target="_blank"
              rel="noreferrer"
              className="text-foreground/70 hover:underline"
            >
              Source
            </a>
            <span className="text-foreground/70">|</span>
            <a
              href="https://berkin.tech/en/about"
              target="_blank"
              rel="noreferrer"
              className="text-foreground/70 hover:underline"
            >
              Berkin Duz
            </a>
          </div>
        </header>
        <AppClient />
      </main>
      <FloatingReturnBadge />
    </div>
  );
}
