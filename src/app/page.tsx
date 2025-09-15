import AppClient from "@/components/AppClient";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <main className="mx-auto max-w-5xl flex flex-col gap-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Pixelixa
            </h1>
            <p className="text-sm text-foreground/70">
              Upload selfie → Download pixel art
            </p>
          </div>
          <a
            href="https://github.com/berkinduz"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-foreground/70 hover:underline"
          >
            Source
          </a>
        </header>
        <AppClient />
      </main>
    </div>
  );
}
