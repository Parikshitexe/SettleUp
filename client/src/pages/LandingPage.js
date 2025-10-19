import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <Link to="/" style={styles.logo}>
            <span style={styles.logoIcon}>💰</span>
            SettleUp
          </Link>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#how-it-works" style={styles.navLink}>How It Works</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            <Link to="/login" style={styles.loginBtn}>Login</Link>
            <Link to="/register" style={styles.signupBtn}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Split Bills & Track Expenses
            <br />
            <span style={styles.heroTitleAccent}>The Smart Way</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Stop the awkward money conversations. SettleUp makes splitting expenses with friends, roommates, and groups effortless.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/register" style={styles.ctaButton}>
              Start Free Today →
            </Link>
            <a href="#how-it-works" style={styles.secondaryButton}>
              See How It Works
            </a>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>Be one of the first to try our app</div>
              <div style={styles.statLabel}>We’re just getting started — help shape the smarter way to split expenses</div>
            </div>
            
          </div>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.mockup}>
            <div style={styles.mockupScreen}>
              <div style={styles.mockupHeader}>
                <div style={styles.mockupDot}></div>
                <div style={styles.mockupDot}></div>
                <div style={styles.mockupDot}></div>
              </div>
              <div style={styles.mockupContent}>
                <div style={styles.mockupCard}>
                  <div style={styles.mockupCardTitle}>Trip to Goa</div>
                  <div style={styles.mockupAmount}>₹12,450</div>
                  <div style={styles.mockupMembers}>5 members</div>
                </div>
                <div style={styles.mockupExpense}>
                  <div>🍕 Pizza Night</div>
                  <div>₹1,200</div>
                </div>
                <div style={styles.mockupExpense}>
                  <div>🚗 Cab Fare</div>
                  <div>₹800</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Everything You Need to Split Smart</h2>
          <p style={styles.sectionSubtitle}>Powerful features that make expense tracking effortless</p>
          
          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>👥</div>
              <h3 style={styles.featureTitle}>Group Expenses</h3>
              <p style={styles.featureDesc}>
                Create unlimited groups for trips, roommates, events, or any shared expenses.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🧮</div>
              <h3 style={styles.featureTitle}>Smart Splitting</h3>
              <p style={styles.featureDesc}>
                Split equally, by percentage, or custom amounts. We handle the math for you.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>⚡</div>
              <h3 style={styles.featureTitle}>Instant Settlements</h3>
              <p style={styles.featureDesc}>
                Our algorithm simplifies debts to minimize transactions between friends.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📊</div>
              <h3 style={styles.featureTitle}>Expense Analytics</h3>
              <p style={styles.featureDesc}>
                Visual charts and reports to understand spending patterns.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔔</div>
              <h3 style={styles.featureTitle}>Payment Reminders</h3>
              <p style={styles.featureDesc}>
                Set automated reminders so no one forgets to settle up.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>💰</div>
              <h3 style={styles.featureTitle}>Budget Tracking</h3>
              <p style={styles.featureDesc}>
                Set budgets for groups and get alerts when you're overspending.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={styles.howItWorks}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <p style={styles.sectionSubtitle}>Get started in 3 simple steps</p>
          
          <div style={styles.stepsContainer}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.stepTitle}>Create a Group</h3>
              <p style={styles.stepDesc}>
                Add friends, roommates, or travel buddies to your group. Invite by email instantly.
              </p>
            </div>

            <div style={styles.stepArrow}>→</div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.stepTitle}>Add Expenses</h3>
              <p style={styles.stepDesc}>
                Record who paid, how much, and how to split it. Simple as that.
              </p>
            </div>

            <div style={styles.stepArrow}>→</div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.stepTitle}>Settle Up</h3>
              <p style={styles.stepDesc}>
                See who owes whom at a glance. Our smart algorithm minimizes transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={styles.pricing}>
        <div style={styles.sectionContent}>
          <h2 style={styles.sectionTitle}>Simple, Transparent Pricing</h2>
          <p style={styles.sectionSubtitle}>Always free. No hidden charges. No credit card required.</p>
          
          <div style={styles.pricingCard}>
            <div style={styles.pricingBadge}>100% FREE</div>
            <div style={styles.pricingAmount}>
              <span style={styles.priceSymbol}>₹</span>0
              <span style={styles.pricePeriod}>/forever</span>
            </div>
            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>✓ Unlimited groups</li>
              <li style={styles.pricingFeature}>✓ Unlimited expenses</li>
              <li style={styles.pricingFeature}>✓ Smart debt simplification</li>
              <li style={styles.pricingFeature}>✓ Payment reminders</li>
              <li style={styles.pricingFeature}>✓ Budget tracking</li>
              <li style={styles.pricingFeature}>✓ Expense analytics</li>
              <li style={styles.pricingFeature}>✓ Email notifications</li>
            </ul>
            <Link to="/register" style={styles.pricingButton}>
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
<section style={styles.testimonials}>
  <div style={styles.sectionContentNew}>
    <h2 style={styles.sectionTitle}>We’re Just Getting Started</h2>
    <p style={styles.testimonialText}>
      Join us early and help shape the next generation of expense-sharing tools.
    </p>
    <Link to="https://forms.gle/KMEqSmyZkrMFBSXw5" style={styles.feedbackButton}>
              Give Feedback
            </Link>
  </div>
</section>


      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Settle Up?</h2>
          <p style={styles.ctaSubtitle}>Join thousands of users who split smarter</p>
          <Link to="/register" style={styles.ctaButtonLarge}>
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <div style={styles.footerLogo}>
              <span style={styles.logoIcon}>💰</span>
              SettleUp
            </div>
            <p style={styles.footerDesc}>
              Making expense splitting effortless for everyone.
            </p>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Product</h4>
            <a href="#features" style={styles.footerLink}>Features</a>
            <a href="#how-it-works" style={styles.footerLink}>How It Works</a>
            <a href="#pricing" style={styles.footerLink}>Pricing</a>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Company</h4>
            <a href="#" style={styles.footerLink}>About Us</a>
            <a href="#" style={styles.footerLink}>Contact</a>
            <a href="#" style={styles.footerLink}>Blog</a>
          </div>

          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Legal</h4>
            <a href="#" style={styles.footerLink}>Privacy Policy</a>
            <a href="#" style={styles.footerLink}>Terms of Service</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>© 2024 SettleUp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff'
  },
  navbar: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #e9ecef',
    padding: '16px 40px',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1cc29f',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoIcon: {
    fontSize: '28px'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'color 0.3s'
  },
  loginBtn: {
    color: '#1cc29f',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
    padding: '8px 20px',
    borderRadius: '6px',
    transition: 'background-color 0.3s'
  },
  signupBtn: {
    backgroundColor: '#1cc29f',
    color: 'white',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
    padding: '10px 24px',
    borderRadius: '6px',
    transition: 'background-color 0.3s'
  },
  hero: {
    padding: '80px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center'
  },
  heroContent: {
    paddingRight: '40px'
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: '1.2',
    marginBottom: '24px'
  },
  heroTitleAccent: {
    color: '#1cc29f'
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    marginBottom: '48px'
  },
  ctaButton: {
    backgroundColor: '#1cc29f',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#1cc29f',
    padding: '16px 32px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    border: '2px solid #1cc29f',
    transition: 'background-color 0.3s'
  },
  heroStats: {
    display: 'flex',
    gap: '40px'
  },
  stat: {
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '25px',
    fontWeight: '700',
    color: '#1cc29f',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  heroImage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mockup: {
    width: '100%',
    maxWidth: '400px'
  },
  mockupScreen: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    border: '8px solid #1a1a1a'
  },
  mockupHeader: {
    backgroundColor: '#1a1a1a',
    padding: '12px 16px',
    display: 'flex',
    gap: '8px'
  },
  mockupDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#666'
  },
  mockupContent: {
    padding: '24px',
    backgroundColor: '#f8f9fa'
  },
  mockupCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  mockupCardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  mockupAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1cc29f',
    marginBottom: '4px'
  },
  mockupMembers: {
    fontSize: '14px',
    color: '#666'
  },
  mockupExpense: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '14px'
  },
  features: {
    padding: '80px 40px',
    backgroundColor: '#f8f9fa'
  },
  sectionContent: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionContentNew:{
  maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: '16px'
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '60px'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px'
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '12px'
  },
  featureDesc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.6'
  },
  howItWorks: {
    padding: '80px 40px',
    backgroundColor: 'white'
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  step: {
    flex: 1,
    textAlign: 'center',
    padding: '0 20px'
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#1cc29f',
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '12px'
  },
  stepDesc: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.6'
  },
  stepArrow: {
    fontSize: '32px',
    color: '#1cc29f',
    fontWeight: '700'
  },
  pricing: {
    padding: '80px 40px',
    backgroundColor: '#f8f9fa'
  },
  pricingCard: {
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '48px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '3px solid #1cc29f'
  },
  pricingBadge: {
    display: 'inline-block',
    backgroundColor: '#1cc29f',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '24px'
  },
  pricingAmount: {
    fontSize: '64px',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '32px'
  },
  priceSymbol: {
    fontSize: '36px',
    verticalAlign: 'super'
  },
  pricePeriod: {
    fontSize: '20px',
    color: '#666',
    fontWeight: '500'
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px 0',
    textAlign: 'left'
  },
  pricingFeature: {
    fontSize: '16px',
    color: '#333',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  pricingButton: {
    display: 'inline-block',
    backgroundColor: '#1cc29f',
    color: 'white',
    padding: '16px 48px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'transform 0.3s'
  },
  feedbackButton: {
  display: 'inline-block',
    backgroundColor: '#1cc29f',
    color: 'white',
    padding: '16px 48px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'transform 0.3s'
  },
  testimonials: {
    padding: '80px 40px',
    backgroundColor: 'white'
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '32px'
  },
  testimonialCard: {
    backgroundColor: '#f8f9fa',
    padding: '32px',
    borderRadius: '12px'
  },
  testimonialStars: {
    color: '#FFD700',
    fontSize: '24px',
    marginBottom: '16px'
  },
  testimonialText: {
    fontSize: '15px',
    color: '#333',
    lineHeight: '1.6',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  testimonialAuthor: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '600'
  },
  cta: {
    padding: '80px 40px',
    backgroundColor: '#1cc29f',
    textAlign: 'center'
  },
  ctaContent: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '16px'
  },
  ctaSubtitle: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '32px'
  },
  ctaButtonLarge: {
    display: 'inline-block',
    backgroundColor: 'white',
    color: '#1cc29f',
    padding: '18px 48px',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: '700',
    textDecoration: 'none',
    transition: 'transform 0.3s'
  },
  footer: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '60px 40px 20px'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '40px',
    marginBottom: '40px'
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  footerLogo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1cc29f',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  footerDesc: {
    fontSize: '14px',
    color: '#999',
    lineHeight: '1.6'
  },
  footerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  footerLink: {
    color: '#999',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s'
  },
  footerBottom: {
    borderTop: '1px solid #333',
    paddingTop: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  }
};

// At the end of the component, before export
if (window.innerWidth <= 768) {
    styles.hero = {
      ...styles.hero,
      gridTemplateColumns: '1fr',
      gap: '40px'
    };
    styles.featureGrid = {
      ...styles.featureGrid,
      gridTemplateColumns: '1fr'
    };
    styles.testimonialsGrid = {
      ...styles.testimonialsGrid,
      gridTemplateColumns: '1fr'
    };
    styles.footerContent = {
      ...styles.footerContent,
      gridTemplateColumns: '1fr'
    };
    styles.navLinks = {
      ...styles.navLinks,
      display: 'none' // Hide on mobile, add hamburger menu if needed
    };
  }

export default LandingPage;