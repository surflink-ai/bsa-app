import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="pb-24 md:pb-0" style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp"
                alt="BSA Logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <div className="font-heading font-bold text-lg">Barbados Surfing Association</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>The National Governing Body for Surfing in Barbados</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Member of the International Surfing Association (ISA) and the Barbados Olympic Association.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Navigate</h4>
            <div className="space-y-2">
              {[
                { href: '/events', label: 'Events' },
                { href: '/athletes', label: 'Athletes' },
                { href: '/rankings', label: 'Rankings' },
                { href: '/profile', label: 'Account' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="block text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Connect</h4>
            <div className="space-y-2">
              <a href="https://www.facebook.com/bsasurf" target="_blank" rel="noopener" className="block text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Facebook</a>
              <a href="https://www.instagram.com/barbadossurfingassociation/" target="_blank" rel="noopener" className="block text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Instagram</a>
              <a href="mailto:barbadossurfingassociation@gmail.com" className="block text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>barbadossurfingassociation@gmail.com</a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Barbados Surfing Association. All rights reserved.</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Powered by <a href="https://liveheats.com" target="_blank" rel="noopener" className="hover:text-white/50">LiveHeats</a></p>
        </div>
      </div>
    </footer>
  )
}
