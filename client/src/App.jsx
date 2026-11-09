
import './App.css';

const categories = [
  'Home',
  'Rwanda',
  'Politics',
  'Business',
  'Sports',
  'Entertainment',
  'Technology',
  'World',
];

const stories = [
  {
    category: 'BUSINESS',
    title: 'Rwanda continues to strengthen its position as a regional business hub',
    time: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900',
  },
  {
    category: 'SPORTS',
    title: 'A new chapter begins for Rwandan football',
    time: '3 hours ago',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900',
  },
  {
    category: 'TECHNOLOGY',
    title: 'Technology is changing the way young Africans do business',
    time: '4 hours ago',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900',
  },
];

function App() {
  return (
    <div className="website">

      {/* HEADER */}
      <header className="header">
        <div className="top-bar">
          <span>MONDAY, NOVEMBER 9, 2026</span>
          <span>INDEPENDENT NEWS • RWANDA</span>
        </div>

        <div className="logo-area">
          <h1>RWANDA <span>TODAY</span></h1>
          <p>THE STORIES THAT MATTER</p>
        </div>

        <nav className="navigation">
          {categories.map((category) => (
            <a href="#" key={category}>{category}</a>
          ))}
        </nav>
      </header>

      {/* BREAKING NEWS */}
      <section className="breaking-news">
        <strong>BREAKING NEWS</strong>
        <p>Welcome to Rwanda Today — your source for the latest news and stories.</p>
      </section>

      {/* MAIN CONTENT */}
      <main className="container">

        {/* SECTION TITLE */}
        <div className="section-heading">
          <h2>TOP STORIES</h2>
          <span>THE LATEST HEADLINES</span>
        </div>

        {/* FEATURED STORIES */}
        <section className="featured-grid">

          <article className="main-story">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200"
              alt="People working together"
            />
            <div className="story-overlay">
              <span className="category">RWANDA</span>
              <h2>Discover the stories shaping Rwanda and the world today</h2>
              <p>By Rwanda Today Editorial Team • 1 hour ago</p>
            </div>
          </article>

          <div className="side-stories">
            {stories.slice(0, 2).map((story, index) => (
              <article className="side-story" key={index}>
                <img src={story.image} alt={story.title} />
                <div>
                  <span className="category">{story.category}</span>
                  <h3>{story.title}</h3>
                  <p>{story.time}</p>
                </div>
              </article>
            ))}
          </div>

        </section>

        {/* TRENDING */}
        <section className="trending">
          <h3>TRENDING NOW</h3>
          <div className="trending-tags">
            <span>#Rwanda</span>
            <span>#Business</span>
            <span>#Entertainment</span>
            <span>#Sports</span>
            <span>#Technology</span>
          </div>
        </section>

        {/* LATEST NEWS */}
        <section className="latest-section">
          <div className="section-heading">
            <h2>LATEST NEWS</h2>
            <span>STAY INFORMED</span>
          </div>

          <div className="news-grid">
            {stories.map((story, index) => (
              <article className="news-card" key={index}>
                <img src={story.image} alt={story.title} />
                <div className="news-card-content">
                  <span className="category">{story.category}</span>
                  <h3>{story.title}</h3>
                  <p>{story.time}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        <h2>RWANDA <span>TODAY</span></h2>
        <p>Bringing you the stories that matter.</p>
        <p>© 2026 Rwanda Today. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default App;
