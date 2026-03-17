'use client'

import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

export default function ProposalClient() {
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const scrollToNext = () => {
    const nextSection = document.getElementById('platform-section')
    nextSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const featureCards = [
    {
      image: '/proposal/homepage-desktop.jpg',
      title: 'Professional Website',
      description: 'Mobile-optimized, custom domain, SSL secured. The digital home of Barbados surfing.'
    },
    {
      image: '/proposal/surf-report-desktop.jpg',
      title: '21-Spot Surf Forecast',
      description: '7 data sources cross-referenced every 15 minutes. Surfline Premium, WindGuru, NOAA buoys, tides.'
    },
    {
      image: '/proposal/results-desktop.jpg',
      title: 'Competition Results',
      description: 'Full heat-by-heat breakdowns with wave scores. Medal standings across 9 divisions.'
    },
    {
      image: '/proposal/athletes-desktop.jpg',
      title: 'Athlete Profiles',
      description: '129+ registered athletes with competition stats, heat wins, and rivalry tracking.'
    },
    {
      image: '/proposal/rankings-desktop.jpg',
      title: 'Season Rankings',
      description: 'Automatic SOTY points calculation. Historical data back to 2019.'
    },
    {
      image: '/proposal/events-desktop.jpg',
      title: 'Event Management',
      description: 'Full event calendar, registration links, division listings, and live results.'
    },
    {
      image: '/proposal/event-detail-desktop.jpg',
      title: 'Livestream Ready',
      description: 'Competition livestream page with score overlay integration.'
    },
    {
      image: '/proposal/athlete-detail-desktop.jpg',
      title: 'Individual Stats',
      description: 'Deep athlete profiles with wave scores, head-to-head records, and career history.'
    }
  ]

  const mobileImages = [
    '/proposal/homepage-mobile.jpg',
    '/proposal/surf-report-mobile.jpg',
    '/proposal/results-mobile.jpg'
  ]

  const techCards = [
    {
      title: 'Supabase Database',
      description: 'PostgreSQL with real-time subscriptions. 129 athletes, 915 wave scores, instant queries.'
    },
    {
      title: '7-Source Surf Engine',
      description: 'Surfline LOTUS, WindGuru ECMWF, NOAA GFS, Open-Meteo, NOAA Buoys, NOAA Tides, Sunrise/Sunset.'
    },
    {
      title: 'Automated Pipeline',
      description: 'Data refreshed every 15 minutes. Zero manual intervention. Always current.'
    },
    {
      title: 'LiveHeats Integration',
      description: 'Competition results synced directly. Athlete stats auto-calculated.'
    },
    {
      title: 'ISA Scoring System',
      description: 'International Surfing Association compliant. Best 2 of N waves, drop high/low.'
    },
    {
      title: 'Global CDN',
      description: 'Vercel edge network. Sub-second page loads worldwide. 99%+ uptime.'
    },
    {
      title: 'Daily Backups',
      description: 'Automated database backups. Your data is safe and recoverable.'
    },
    {
      title: 'SSL Encryption',
      description: 'HTTPS everywhere. Security headers. Protected API endpoints.'
    },
    {
      title: 'Smart Analysis',
      description: 'Swell window filtering, multi-model consensus, buoy confirmation signals.'
    }
  ]

  const onboardingSteps = [
    {
      title: 'Review and Approval',
      description: 'BSA committee reviews this proposal and approves the partnership.'
    },
    {
      title: 'Agreement Signing',
      description: 'NDA and service agreement signed by both parties.'
    },
    {
      title: 'Email Setup',
      description: 'Google Workspace configured for committee members (@bsa.surf email addresses).'
    },
    {
      title: 'Asset Collection',
      description: 'Official BSA logos, photos, and content gathered.'
    },
    {
      title: 'Platform Handover',
      description: 'Full access granted. Training provided. Platform officially under management.'
    },
    {
      title: 'First Invoice',
      description: 'Year One payment of BDS$ 5,000 activates the agreement.'
    }
  ]

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {/* SECTION 1 - HERO */}
      <section style={{
        background: '#0A2540',
        color: '#FFFFFF',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        position: 'relative'
      }}>
        <ScrollReveal>
          <div style={{ marginBottom: '3rem' }}>
            <img 
              src="/bsa-logo.webp" 
              alt="BSA Logo"
              style={{ width: '120px', height: '120px', marginBottom: '2rem' }}
            />
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '4rem',
              fontWeight: '800',
              margin: '0 0 1rem 0',
              letterSpacing: '0.02em'
            }}>
              BSA.SURF
            </h1>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '1.8rem',
              fontWeight: '400',
              margin: '0 0 2rem 0',
              opacity: 0.9
            }}>
              Platform Management Proposal
            </h2>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1.1rem',
              margin: '0 0 0.5rem 0',
              opacity: 0.8
            }}>
              Prepared for the Barbados Surfing Association
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1rem',
              margin: '0 0 3rem 0',
              opacity: 0.7
            }}>
              By SurfLink — March 2026
            </p>
            <div style={{
              background: 'rgba(43, 165, 160, 0.2)',
              border: '1px solid #2BA5A0',
              padding: '1rem 2rem',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                margin: 0,
                color: '#2BA5A0'
              }}>
                All prices in Barbados Dollars (BDS$)
              </p>
            </div>
          </div>
        </ScrollReveal>
        
        <button 
          onClick={scrollToNext}
          style={{
            position: 'absolute',
            bottom: '2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            animation: 'bounce 2s infinite'
          }}
        >
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '20px solid #FFFFFF',
            opacity: 0.6
          }} />
        </button>
      </section>

      <WaveDivider />

      {/* SECTION 2 - THE PLATFORM */}
      <section id="platform-section" style={{
        background: '#FFFFFF',
        color: '#0A2540',
        padding: '6rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.9rem',
              color: '#2BA5A0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 1rem 0'
            }}>
              THE PLATFORM
            </p>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '3rem',
              fontWeight: '700',
              margin: '0 0 1rem 0'
            }}>
              Built For Barbados Surfing
            </h2>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1.2rem',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              A purpose-built digital platform serving athletes, fans, judges, and the BSA committee.
            </p>
          </div>
        </ScrollReveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem'
        }}>
          {featureCards.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(10, 37, 64, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ height: '280px', overflow: 'hidden' }}>
                  <img 
                    src={feature.image}
                    alt={feature.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    margin: '0 0 0.5rem 0',
                    color: '#0A2540'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#6B7280',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 3 - MOBILE EXPERIENCE */}
      <section style={{
        background: '#0A2540',
        color: '#FFFFFF',
        padding: '6rem 2rem',
        textAlign: 'center'
      }}>
        <ScrollReveal>
          <div style={{ marginBottom: '4rem' }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.9rem',
              color: '#2BA5A0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0 0 1rem 0'
            }}>
              MOBILE FIRST
            </p>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '3rem',
              fontWeight: '700',
              margin: '0 0 1rem 0'
            }}>
              Native-Feel Experience
            </h2>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1.2rem',
              opacity: 0.8,
              maxWidth: '600px',
              margin: '0 auto 3rem auto'
            }}>
              Designed for how people actually browse — on their phones.
            </p>
          </div>
        </ScrollReveal>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          {mobileImages.map((image, index) => (
            <ScrollReveal key={index} delay={index * 200}>
              <div style={{
                transform: `rotate(${(index - 1) * 3}deg)`,
                transition: 'all 0.3s ease'
              }}>
                <img 
                  src={image}
                  alt={`Mobile view ${index + 1}`}
                  style={{
                    width: '260px',
                    height: 'auto',
                    borderRadius: '20px',
                    border: '4px solid #2BA5A0',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '1.1rem',
            opacity: 0.8,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Bottom navigation dock, hamburger menu, responsive design across all devices.
          </p>
        </ScrollReveal>
      </section>

      <WaveDivider />

      {/* SECTION 4 - BEHIND THE SCENES */}
      <section style={{
        background: '#FFFFFF',
        color: '#0A2540',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: '#2BA5A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 1rem 0'
              }}>
                UNDER THE HOOD
              </p>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '3rem',
                fontWeight: '700',
                margin: '0 0 1rem 0'
              }}>
                Enterprise-Grade Infrastructure
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '1.2rem',
                opacity: 0.8,
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                The technology powering bsa.surf
              </p>
            </div>
          </ScrollReveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {techCards.map((card, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '2rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2BA5A0'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <h3 style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    margin: '0 0 1rem 0',
                    color: '#0A2540'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#6B7280',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {card.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 5 - MARKET VALUE */}
      <section style={{
        background: '#0A2540',
        color: '#FFFFFF',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: '#2BA5A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 1rem 0'
              }}>
                MARKET COMPARISON
              </p>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '3rem',
                fontWeight: '700',
                margin: '0 0 3rem 0'
              }}>
                What This Would Normally Cost
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '3rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Solution</th>
                    <th style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      textAlign: 'right',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Build Cost</th>
                    <th style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      textAlign: 'right',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Ongoing</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{
                      fontFamily: 'DM Sans, sans-serif',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Custom agency build</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 20,000+</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 400-1,000/mo</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{
                      fontFamily: 'DM Sans, sans-serif',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Agency maintenance only</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#6B7280'
                    }}>—</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 400-1,000/mo</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{
                      fontFamily: 'DM Sans, sans-serif',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>WordPress + plugins</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 4,000-10,000</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 100-200/mo</td>
                  </tr>
                  <tr>
                    <td style={{
                      fontFamily: 'DM Sans, sans-serif',
                      padding: '1rem 0',
                      color: '#FFFFFF'
                    }}>Squarespace / Wix</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#6B7280'
                    }}>—</td>
                    <td style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '1rem 0',
                      textAlign: 'right',
                      color: '#FFFFFF'
                    }}>BDS$ 60-100/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0',
                  color: '#FFFFFF'
                }}>
                  Market Value
                </h3>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.2rem',
                  margin: '0 0 0.5rem 0',
                  color: '#6B7280',
                  textDecoration: 'line-through'
                }}>
                  BDS$ 20,000+ build
                </p>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.2rem',
                  margin: 0,
                  color: '#6B7280',
                  textDecoration: 'line-through'
                }}>
                  BDS$ 600/mo maintenance
                </p>
              </div>
              
              <div style={{
                fontSize: '2rem',
                color: '#2BA5A0'
              }}>
                →
              </div>
              
              <div style={{
                background: '#2BA5A0',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#FFFFFF'
              }}>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0'
                }}>
                  BSA.SURF
                </h3>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0'
                }}>
                  BDS$ 0 build cost
                </p>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.2rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  from BDS$ 250/mo
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 6 - THE OFFER */}
      <section style={{
        background: '#FFFFFF',
        color: '#0A2540',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: '#2BA5A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 1rem 0'
              }}>
                YOUR INVESTMENT
              </p>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '3rem',
                fontWeight: '700',
                margin: '0 0 3rem 0'
              }}>
                One Simple Plan. Everything Included.
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{
              maxWidth: '500px',
              margin: '0 auto 4rem auto',
              border: '2px solid #2BA5A0',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  color: '#2BA5A0',
                  textTransform: 'uppercase',
                  margin: '0 0 0.5rem 0'
                }}>
                  Year One
                </p>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '3rem',
                  fontWeight: '800',
                  margin: '0 0 0.5rem 0',
                  color: '#0A2540'
                }}>
                  BDS$ 5,000
                </p>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#6B7280',
                  margin: 0
                }}>
                  Platform setup + 12 months full management
                </p>
              </div>

              <div style={{
                height: '1px',
                background: '#E5E7EB',
                margin: '2rem 0'
              }} />

              <div style={{ marginBottom: '2rem' }}>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  color: '#2BA5A0',
                  textTransform: 'uppercase',
                  margin: '0 0 0.5rem 0'
                }}>
                  Year Two Onwards
                </p>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '2rem',
                  fontWeight: '700',
                  margin: '0 0 0.5rem 0',
                  color: '#0A2540'
                }}>
                  BDS$ 2,500 / year
                </p>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#6B7280',
                  margin: 0
                }}>
                  Annual renewal — full management continues
                </p>
              </div>

              <div style={{
                height: '1px',
                background: '#E5E7EB',
                margin: '2rem 0'
              }} />

              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '1.1rem',
                color: '#0A2540',
                margin: 0
              }}>
                Or month-to-month: <span style={{ fontWeight: '600' }}>BDS$ 250/mo</span>
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '1.8rem',
                fontWeight: '600',
                margin: '0 0 2rem 0',
                color: '#0A2540'
              }}>
                What's Included
              </h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              <div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  lineHeight: '2'
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Platform hosting and infrastructure
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    All competition event syncs (5 per year)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Athlete data management
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Surf forecast engine (7 sources)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Content updates on request
                  </li>
                </ul>
              </div>
              <div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  lineHeight: '2'
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Bug fixes and security patches
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Monthly health monitoring
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Google Workspace email setup
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Committee email accounts (@bsa.surf)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      background: '#2BA5A0', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} />
                    Priority email support
                  </li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 7 - HOW IT WORKS */}
      <section style={{
        background: '#0A2540',
        color: '#FFFFFF',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: '#2BA5A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 1rem 0'
              }}>
                MANAGEMENT STRUCTURE
              </p>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '3rem',
                fontWeight: '700',
                margin: '0 0 3rem 0'
              }}>
                How It Works
              </h2>
            </div>
          </ScrollReveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}>
            {[
              {
                title: 'SurfLink Manages',
                description: 'All technical infrastructure, hosting, maintenance, security, data syncing, and platform updates.'
              },
              {
                title: 'BSA Provides',
                description: 'Event information, news content, committee decisions, and feedback on platform direction.'
              },
              {
                title: 'Together',
                description: 'A professional digital presence that elevates Barbados surfing on the world stage.'
              }
            ].map((card, index) => (
              <ScrollReveal key={index} delay={index * 200}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(43, 165, 160, 0.3)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    margin: '0 0 1rem 0',
                    color: '#2BA5A0'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#FFFFFF',
                    margin: 0,
                    lineHeight: '1.6',
                    opacity: 0.9
                  }}>
                    {card.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0',
                  color: '#2BA5A0'
                }}>
                  After Each Competition
                </h3>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#FFFFFF',
                  opacity: 0.8,
                  lineHeight: '1.6'
                }}>
                  Results automatically sync from LiveHeats. Rankings update instantly. No manual data entry required.
                </p>
              </div>
              <div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  margin: '0 0 1rem 0',
                  color: '#2BA5A0'
                }}>
                  Ongoing Maintenance
                </h3>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '1rem',
                  color: '#FFFFFF',
                  opacity: 0.8,
                  lineHeight: '1.6'
                }}>
                  Security updates, performance monitoring, bug fixes, and feature improvements handled seamlessly.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 8 - ONBOARDING PREVIEW */}
      <section style={{
        background: '#FFFFFF',
        color: '#0A2540',
        padding: '6rem 2rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: '#2BA5A0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                margin: '0 0 1rem 0'
              }}>
                GETTING STARTED
              </p>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '3rem',
                fontWeight: '700',
                margin: '0 0 3rem 0'
              }}>
                What Happens Next
              </h2>
            </div>
          </ScrollReveal>

          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '2rem',
              top: '0',
              bottom: '0',
              width: '2px',
              background: '#E5E7EB'
            }} />

            {onboardingSteps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '3rem',
                  position: 'relative'
                }}>
                  {/* Step number */}
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    background: '#2BA5A0',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    marginRight: '2rem',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Step content */}
                  <div style={{ flex: 1, paddingTop: '0.5rem' }}>
                    <h3 style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '1.4rem',
                      fontWeight: '600',
                      margin: '0 0 0.5rem 0',
                      color: '#0A2540'
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '1rem',
                      color: '#6B7280',
                      margin: 0,
                      lineHeight: '1.6'
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 9 - CONTACT / CTA */}
      <section style={{
        background: '#0A2540',
        color: '#FFFFFF',
        padding: '6rem 2rem',
        textAlign: 'center'
      }}>
        <ScrollReveal>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '3rem',
              fontWeight: '700',
              margin: '0 0 2rem 0'
            }}>
              Ready to Get Started?
            </h2>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '1.2rem',
              margin: '0 0 3rem 0',
              opacity: 0.9
            }}>
              Contact Adam Worrell to discuss this proposal and take the next step.
            </p>
            
            <div style={{
              background: 'rgba(43, 165, 160, 0.1)',
              border: '2px solid #2BA5A0',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '3rem'
            }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1.2rem',
                margin: '0 0 1rem 0',
                color: '#2BA5A0'
              }}>
                paew82@gmail.com
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '1rem',
                margin: '0 0 0.5rem 0',
                opacity: 0.8
              }}>
                SurfLink — Barbados
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.9rem',
                margin: 0,
                opacity: 0.7
              }}>
                Prepared March 2026
              </p>
            </div>

            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.8rem',
              opacity: 0.6,
              fontStyle: 'italic'
            }}>
              This proposal is confidential and intended for the Barbados Surfing Association committee only.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  )
}