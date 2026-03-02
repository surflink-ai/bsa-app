// News/blog articles — all facts verified via LiveHeats API

export interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: "event-recap" | "athlete-spotlight" | "announcement" | "international"
  image?: string
  content: string
}

const articles: Article[] = [
  {
    slug: "soty-2025-nationals-recap",
    title: "SOTY 2025 Nationals Recap — Soup Bowl Delivers",
    excerpt: "Jacob Burke and Chelsea Tuach claim Open titles at the Barbados Independence Surf Pro & Nationals.",
    date: "2025-11-14",
    author: "BSA",
    category: "event-recap",
    content: `<p>The 2025 Barbados Independence Surf Pro &amp; Nationals wrapped up at Soup Bowl, Bathsheba on November 14, capping off the SOTY Championship 2025 season.</p>

<h3>Open Divisions</h3>
<p><strong>Open Mens:</strong> Jacob Burke took the title with a 13.84 combined score, ahead of Bruce Mackie (11.90) and Rafe Gooding (9.97).</p>
<p><strong>Open Womens:</strong> Chelsea Tuach claimed her fourth consecutive Open Womens national title, posting 12.74 over Chelsea Roett (10.50) and Kealani Rapson (3.57).</p>

<h3>Pro Divisions</h3>
<p><strong>Pro Mens:</strong> Joshua Burke led with a 14.94, defeating Jacob Burke (12.66) and Teddy Wittemann (10.17).</p>
<p><strong>Pro Womens:</strong> Chelsea Roett earned the Pro Womens win with an 11.00, edging out Chelsea Tuach (9.93) and Amy Godson (6.47).</p>
<p><strong>Pro Juniors:</strong> Tommaso Layson dominated with a 14.74, followed by Daniel Banfield (11.27) and Christian Stoute (9.60).</p>

<h3>Junior Divisions</h3>
<p>Daniel Banfield took double titles in Under 16 Boys (10.84) and Under 14 Boys (10.77). Tommaso Layson won Under 18 Boys (13.83). Amy Godson swept both Under 18 Girls (12.17) and Under 16 Girls (8.00).</p>

<h3>Other Divisions</h3>
<p>Christopher Clarke won Grand Masters (10.70). Jacob Burke added the Longboard Open title (10.66) to his Open Mens win.</p>`,
  },
  {
    slug: "chelsea-tuach-four-time-open-womens-champion",
    title: "Chelsea Tuach: Four Consecutive Open Womens Titles",
    excerpt: "From 2022 to 2025, Chelsea Tuach has won every BSA Open Womens national championship.",
    date: "2025-11-15",
    author: "BSA",
    category: "athlete-spotlight",
    content: `<p>Chelsea Tuach has won the BSA Open Womens national title in every year it has been contested on LiveHeats — 2022, 2023, 2024, and 2025.</p>

<h3>The Record</h3>
<ul>
<li><strong>2022</strong> — Open Womens champion at the TSL Barbados National Independence Surf Pro, Soup Bowl (score: 12.77)</li>
<li><strong>2023</strong> — Open Womens champion at the TSL National Championship &amp; Independence Pro, Soup Bowl (score: 15.50)</li>
<li><strong>2024</strong> — Open Womens champion at the Barbados Independence Surf Pro, Soup Bowl (score: 13.66). Also won Pro Womens (12.50).</li>
<li><strong>2025</strong> — Open Womens champion at the Barbados Independence Surf Pro &amp; Nationals, Soup Bowl (score: 12.74)</li>
</ul>

<p>Her highest-scoring performance came in 2023 with a 15.50 combined total. In addition to her Open Womens titles, Tuach also won the Pro Womens division in both 2023 and 2024.</p>`,
  },
  {
    slug: "soty-2026-season-preview",
    title: "SOTY 2026: Season Opens March 14",
    excerpt: "The first event of the SOTY Championship 2026 season is confirmed for March 14.",
    date: "2026-02-28",
    author: "BSA",
    category: "announcement",
    content: `<p>The SOTY Championship 2026 season kicks off on <strong>March 14, 2026</strong> with Event #1.</p>

<h3>Confirmed Divisions</h3>
<ul>
<li>Open Mens</li>
<li>Open Womens</li>
<li>Under 18 Boys</li>
<li>Under 18 Girls</li>
<li>Under 16 Boys</li>
<li>Under 14 Boys</li>
</ul>

<p>Registration is open via <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer">LiveHeats</a>.</p>`,
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
    "international": "International",
  }
  return labels[category] || category
}

export function getLatestArticles(count: number = 3): Article[] {
  return getAllArticles().slice(0, count)
}
