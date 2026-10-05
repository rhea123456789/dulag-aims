import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader } from '../components/SiteHeader'
import { features } from './LandingPage'

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

export function FeaturesPage() {
  return (
    <div className="site home">
      <SiteHeader />
      <main>
        <section className="home-block" id="features">
          <div className="home-block-head">
            <div>
              <p className="home-kicker mark">System modules</p>
              <h2>What the System Manages</h2>
            </div>
            <Link className="home-more" to="/">Back to home <Arrow /></Link>
          </div>
          <div className="home-feature-row">
            {features.map(([src, position, title, text]) => (
              <article className="home-feature" key={title}>
                <img src={src} alt="" style={{ objectPosition: position }} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
