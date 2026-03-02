// News/blog articles — verified from BSA Instagram, LiveHeats, WSL

export interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: "event-recap" | "athlete-spotlight" | "announcement"
  content: string
}

const articles: Article[] = [
  {
    slug: "burke-brothers-double-feature-premiere",
    title: "Fish Out of Water & Real Estate: The Burke Brothers Hit the Big Screen",
    excerpt: "Jacob and Josh Burke premiered their highly anticipated surf films to a packed crowd at Hayman's Market — and the energy was electric.",
    date: "2026-02-27",
    author: "BSA",
    category: "athlete-spotlight",
    content: `<p>On Friday February 27th, the Barbados surf community came together at Hayman's Market for a night that celebrated everything great about island surfing culture. Projected on a 25-foot HD screen under the open sky, the crowd was treated to not one but two surf films from Barbados' most prolific surfing family.</p>

<h3>Fish Out of Water — Jacob Burke</h3>
<p>Jacob Burke's "Fish Out of Water" showcased what those who've watched him at Soup Bowl already know — the kid is one of the most talented barrel riders on the planet. The film captures Jacob threading impossibly deep tubes with a style and confidence that belies his years. His brother Josh put it best on Instagram: "On this swell, my brother proved that he is very well one of the most talented barrel riders on this planet. Gifted is an understatement."</p>

<p>Jacob, who claimed both the Open Mens and Longboard Open national titles at the 2025 SOTY Nationals with scores of 13.84 and 10.66, continues to push the boundaries of what's possible at Bathsheba's famous reef break.</p>

<h3>Real Estate — Josh Burke</h3>
<p>Josh Burke's "Real Estate" delivered a different flavour — a Caribbean-soaked journey through the waves and places that have shaped his career. Fresh off his return to the WSL Challenger Series where he made Finals Day at the BTMI Barbados Surf Pro at Soup Bowl, the film captures Josh at the peak of his powers.</p>

<p>The premiere was free to attend, a fitting gesture from two brothers who've always kept their roots firmly planted in the Barbados surf community. The night also featured clips from Josh's latest edit "West Indian Wonderland."</p>

<p>Both films are a testament to the calibre of talent coming out of Barbados — and a reminder that Soup Bowl remains one of the most photogenic waves on the planet.</p>`,
  },
  {
    slug: "josh-burke-returns-to-challenger-series",
    title: "Josh Burke Back on the WSL Challenger Series — And He's Making Noise",
    excerpt: "Barbados' Josh Burke made Finals Day at the BTMI Barbados Surf Pro and spent a month grinding through CS events in Puerto Rico.",
    date: "2026-02-20",
    author: "BSA",
    category: "athlete-spotlight",
    content: `<p>Josh Burke is back where he belongs — competing against the best surfers on the planet on the WSL Challenger Series. And he's not just making up the numbers.</p>

<h3>Finals Day at Home</h3>
<p>At the BTMI Barbados Surf Pro, presented by Diamonds International, Josh delivered in front of a home crowd at Soup Bowl. Navigating through a stacked field that included former CT competitor Alan Cleland Jr, Burke powered his way to Finals Day — a statement performance that announced his return to the world stage.</p>

<p>The WSL broadcast captured what Barbados locals have known for years: Josh Burke in heavy Soup Bowl is as good as it gets. "Welcome back to the CS," the commentary team declared as Burke threaded another Bathsheba barrel.</p>

<h3>The Puerto Rico Campaign</h3>
<p>Josh then headed to Puerto Rico for a full month on the CS grind — competing in 14 heats across multiple events and picking up three 5th-place finishes. The experience of sustained competition at that level is invaluable, and Burke returned to Barbados sharper than ever.</p>

<h3>What It Means for Barbados</h3>
<p>Burke's presence on the Challenger Series keeps Barbados on the global surfing map. With his brother Jacob dominating locally and Josh flying the flag internationally, the Burke family continues to be the beating heart of Barbadian competitive surfing. As Josh posted: "Barbadian 💯🇧🇧" — and the world is taking notice.</p>

<p>Josh is supported by CI Surfboards, Futures Fins, Laticrete, and Foursquare Rum Distillery.</p>`,
  },
  {
    slug: "trent-corbin-wins-u14-wsl-special-event",
    title: "Trent Corbin Takes U14 Title at WSL Barbados Surf Pro Special Event",
    excerpt: "The young Barbadian standout claimed the Under 14 division during a special event held alongside the BTMI Barbados Surf Pro at Soup Bowl.",
    date: "2026-02-18",
    author: "BSA",
    category: "event-recap",
    content: `<p>Trent Corbin added another title to his growing collection, winning the Under 14 division at the special event held alongside the BTMI Barbados Surf Pro, the WSL Challenger Series stop at Soup Bowl.</p>

<h3>A Rising Force</h3>
<p>Corbin has been on a tear through the junior divisions. In the 2025 SOTY season alone, he claimed the U14 title at SOTY Event #3 at Soup Bowl with a commanding 12.27 combined score, beating out Daniel Banfield (10.43) and Ras Menelik Lewis (6.97). He also won U16 Boys at SOTY Event #2 with a dominant 12.00.</p>

<p>His performances have been characterised by a maturity beyond his years — clean rail work, smart wave selection, and a competitive fire that's hard to teach. Trent consistently posts scores in the 10+ range, putting him shoulder-to-shoulder with surfers several years his senior.</p>

<h3>The Next Generation</h3>
<p>Corbin is part of a talented crop of Barbados juniors that includes Daniel Banfield, Ras Menelik Lewis, and Kian Brits — all of whom have been trading victories throughout the SOTY Championship series. This generation of groms is deeper and more competitive than ever, which bodes well for the future of Barbadian surfing.</p>

<p>With the 2026 SOTY season kicking off on March 14th at Drill Hall, all eyes will be on whether Corbin can carry his momentum into the new campaign.</p>`,
  },
  {
    slug: "chelsea-tuach-presidents-award",
    title: "Chelsea Tuach Receives President's Award at BOA 70th Anniversary",
    excerpt: "Four-time national champion honoured by the Barbados Olympic Association at their milestone anniversary ceremony.",
    date: "2026-01-25",
    author: "BSA",
    category: "athlete-spotlight",
    content: `<p>Chelsea Tuach received the President's Award at the Barbados Olympic Association's 70th anniversary awards ceremony — a recognition that speaks to her impact not just in surfing, but in Barbadian sport as a whole.</p>

<p>"What a SURPRISE and HONOUR it is to receive the President's award," Tuach shared on Instagram. "Thank you President Osborne and the entire Olympic Barbados family for this recognition and the many years of your unwavering support. I am proud to be a Barbadian athlete — bring on 2026!!!"</p>

<h3>The Record Speaks</h3>
<p>Tuach's resume is unmatched in Barbados women's surfing. She's won the BSA Open Womens national title four consecutive years running — 2022, 2023, 2024, and 2025 — and added Pro Womens titles in 2023 and 2024 for good measure. Her highest-scoring performance came in 2023 with a 15.50 combined total at the TSL National Championship at Soup Bowl.</p>

<p>Beyond local dominance, Tuach has represented Barbados at the ISA World Surfing Games and continues to be an ambassador for Caribbean surfing worldwide.</p>

<h3>Looking Ahead</h3>
<p>With the 2026 SOTY season approaching, Tuach will be the heavy favourite to extend her Open Womens streak to five. The first event is set for March 14th at Drill Hall.</p>`,
  },
  {
    slug: "soty-2026-season-schedule",
    title: "2026 SOTY Season: Five Events, Five Breaks, One Champion",
    excerpt: "The full 2026 SOTY Championship schedule is locked in — from Drill Hall in March to the Independence Pro & Nationals at Soup Bowl in November.",
    date: "2026-02-25",
    author: "BSA",
    category: "announcement",
    content: `<p>The Barbados Surfing Association has announced the complete 2026 Surfer of the Year Championship schedule, featuring five events across five of Barbados' best competition breaks.</p>

<h3>2026 Schedule</h3>
<ul>
<li><strong>SOTY #1</strong> — March 14 — Drill Hall</li>
<li><strong>SOTY #2</strong> — April 11 — South Point</li>
<li><strong>SOTY #3</strong> — May 9 — Long Beach</li>
<li><strong>SOTY #4</strong> — September 26 — Parlour</li>
<li><strong>Independence Pro &amp; Nationals</strong> — November 27–29 — Soup Bowl</li>
</ul>

<p>Divisions include Open Mens, Open Womens, Under 18 Boys, Under 18 Girls, Under 16 Boys, and Under 14 Boys, with additional divisions expected at the Nationals.</p>

<h3>New Leadership</h3>
<p>The 2026 season also marks a new chapter for the BSA with the election of the 2026–2027 Management Committee. Stewart Stoute takes over as President, with Barry Banfield as Vice President, Lorena Brits as Secretary, Nick Hughes as Treasurer, and Stefan Corbin as PR Officer. Committee members include Christopher Clarke, Drum Drummond, Noah Campbell, and Jacob Burke.</p>

<p>Registration is open at <a href="https://bsa.surf" target="_blank" rel="noopener noreferrer">bsa.surf</a>.</p>`,
  },
]

export function getAllArticles(): Article[] {
  return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticle(slug: string): Article | null {
  return articles.find(a => a.slug === slug) || null
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "event-recap": "Event Recap",
    "athlete-spotlight": "Athlete Spotlight",
    "announcement": "Announcement",
  }
  return labels[category] || category
}

export function getLatestArticles(count: number = 3): Article[] {
  return getAllArticles().slice(0, count)
}
