import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Scout Toolkit. Desenvolvido para os Escoteiros de Portugal.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacidade
          </Link>
          <Link 
            href="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Termos
          </Link>
          <Link 
            href="https://github.com/MPimenta/scout-toolkit-v2" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
