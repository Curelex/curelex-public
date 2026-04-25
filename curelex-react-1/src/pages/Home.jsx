// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';

const Home = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPatientSignUp, setShowPatientSignUp] = useState(false);
  const [showDoctorSignUp, setShowDoctorSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('patient-login');
  const [loading, setLoading] = useState(false);

  const [consultForm, setConsultForm] = useState({
    fullName: '', phoneCode: '+91', mobile: '', email: '', state: '', service: ''
  });
  const [patientLogin, setPatientLogin] = useState({ email: '', password: '' });
  const [doctorLogin, setDoctorLogin] = useState({ email: '', password: '' });
  const [patientSignUp, setPatientSignUp] = useState({
    fullName: '', mobile: '', email: '', password: '' 
  });
  const [doctorSignUp, setDoctorSignUp] = useState({
    fullName: '', email: '', age: '', gender: '', specialization: '',
    regNumber: '', regState: '', hospital: '', experience: '', patients: '',
    photo: null, cert: null, password: ''
  });
  const [passwordVisible, setPasswordVisible] = useState({ patient: false, doctor: false });

  const DEMO_PATIENT = { email: 'patient@curelex.com', password: 'patient123', name: 'Demo Patient', id: 'P001' };
  const DEMO_DOCTOR = { email: 'doctor@curelex.com', password: 'doctor123', name: 'Demo Doctor', id: 'D001' };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleConsultSubmit = (e) => {
    e.preventDefault();
    showToast('Consultation request submitted! We will contact you shortly.', 'success');
    setConsultForm({ fullName: '', phoneCode: '+91', mobile: '', email: '', state: '', service: '' });
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (patientLogin.email === DEMO_PATIENT.email && patientLogin.password === DEMO_PATIENT.password) {
      login({ id: DEMO_PATIENT.id, name: DEMO_PATIENT.name, email: DEMO_PATIENT.email, role: 'patient' }, 'demo-token-123');
      showToast('Patient login successful!', 'success');
      setShowLoginModal(false);
      navigate('/patient-dashboard');
    } else {
      showToast('Invalid credentials. Try: patient@curelex.com / patient123', 'error');
    }
    setLoading(false);
  };

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (doctorLogin.email === DEMO_DOCTOR.email && doctorLogin.password === DEMO_DOCTOR.password) {
      login({ id: DEMO_DOCTOR.id, name: DEMO_DOCTOR.name, email: DEMO_DOCTOR.email, role: 'doctor' }, 'demo-token-456');
      showToast('Doctor login successful!', 'success');
      setShowLoginModal(false);
      navigate('/doctor-dashboard');
    } else {
      showToast('Invalid credentials. Try: doctor@curelex.com / doctor123', 'error');
    }
    setLoading(false);
  };

  const handlePatientSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPatient = {
      id: 'P' + Date.now(), name: patientSignUp.fullName, email: patientSignUp.email,
      mobile: patientSignUp.mobile, password: patientSignUp.password, role: 'patient'
    };
    const existingUsers = JSON.parse(localStorage.getItem('curelex_users') || '[]');
    existingUsers.push(newPatient);
    localStorage.setItem('curelex_users', JSON.stringify(existingUsers));
    showToast('Patient registration successful! Please login.', 'success');
    setShowPatientSignUp(false);
    setShowLoginModal(true);
    setActiveTab('patient-login');
    setPatientSignUp({ fullName: '', mobile: '', email: '', password: '' });
    setLoading(false);
  };

  const handleDoctorSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newDoctor = {
      id: 'D' + Date.now(), name: doctorSignUp.fullName, email: doctorSignUp.email,
      age: doctorSignUp.age, gender: doctorSignUp.gender, specialization: doctorSignUp.specialization,
      regNumber: doctorSignUp.regNumber, regState: doctorSignUp.regState, hospital: doctorSignUp.hospital,
      experience: doctorSignUp.experience, patients: doctorSignUp.patients,
      password: doctorSignUp.password, role: 'doctor', status: 'pending'
    };
    const existingDoctors = JSON.parse(localStorage.getItem('curelex_doctors') || '[]');
    existingDoctors.push(newDoctor);
    localStorage.setItem('curelex_doctors', JSON.stringify(existingDoctors));
    showToast('Doctor registration submitted for approval!', 'success');
    setShowDoctorSignUp(false);
    setDoctorSignUp({ fullName: '', email: '', age: '', gender: '', specialization: '', regNumber: '', regState: '', hospital: '', experience: '', patients: '', photo: null, cert: null, password: '' });
    setLoading(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    closeMobileMenu();
  };

  return (
    <>
      <Toast />

      {/* Navbar */}
      <nav className="navbar" id="navbar">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img className="logo-img" src="/assets/logo.png" alt="CURELEX" />
          </Link>
          <ul className="nav-links">
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
            <Link to={"/about"}><li>About</li></Link>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact Us</a></li>
          </ul>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <button className="login-btn" onClick={() => setShowRoleModal(true)}>
              <i className="fas fa-user"></i> Login
            </button>
            <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <ul>
          <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
          <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
          <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact Us</a></li>
          <li>
            <button className="theme-toggle-mobile" onClick={toggleTheme}>
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              <span> {theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </li>
          <li><button className="login-btn-mobile" onClick={() => { setShowRoleModal(true); closeMobileMenu(); }}>Login</button></li>
        </ul>
      </div>

      <div style={{ height: '81px', background: 'var(--bg-primary)' }}></div>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-split">
          <div className="hero-left">
            <img
              className="hero-bg-img"
              // src="https://media.istockphoto.com/id/998313080/photo/smiling-medical-team-standing-together-outside-a-hospital.jpg?s=612x612&w=0&k=20&c=fXzbjAoStQ_8jTM4TQxbHBEjhETI3vq5_7d_JL19eCA="
              src="/assets/front.jpeg"
              alt=""
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="hero-trust-badge">Trusted by 10,000+ Patients</div>
            <div className="hero-left-content">
              <h1>Your Health, Our <span>Priority</span></h1>
              <p>Advanced healthcare connecting patients with expert doctors for better diagnosis and treatment.</p>
              <div className="hero-stats">
                <div className="stat-item"><span className="stat-number">10K+</span><span className="stat-label">Patients</span></div>
                <div className="stat-item"><span className="stat-number">500+</span><span className="stat-label">Doctors</span></div>
                <div className="stat-item"><span className="stat-number">50+</span><span className="stat-label">Hospitals</span></div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <p className="form-heading">Submit your details and unlock a <span className="free">FREE</span> Expert Consultation</p>
            <form className="consult-form" onSubmit={handleConsultSubmit}>
              <input
                type="text" placeholder="Full Name" value={consultForm.fullName}
                onChange={(e) => setConsultForm({ ...consultForm, fullName: e.target.value })} required
              />
              <div className="phone-row">
                <select value={consultForm.phoneCode} onChange={(e) => setConsultForm({ ...consultForm, phoneCode: e.target.value })}>
                  <option>+91</option>
                  <option>+1</option>
                  <option>+44</option>
                </select>
                <input
                  type="tel" placeholder="Mobile Number" value={consultForm.mobile}
                  onChange={(e) => setConsultForm({ ...consultForm, mobile: e.target.value })} required
                />
              </div>
              <input
                type="email" placeholder="Enter your Email" value={consultForm.email}
                onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })} required
              />
              <select value={consultForm.state} onChange={(e) => setConsultForm({ ...consultForm, state: e.target.value })} required>
                <option value="">Select your State</option>
                <option>Uttar Pradesh</option>
                <option>Delhi</option>
                <option>Maharashtra</option>
                <option>Karnataka</option>
                <option>Tamil Nadu</option>
                <option>West Bengal</option>
              </select>
              <select value={consultForm.service} onChange={(e) => setConsultForm({ ...consultForm, service: e.target.value })} required>
                <option value="">Select Service</option>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Orthopedics</option>
                <option>Pediatrics</option>
              </select>
              <button type="submit" className="consult-btn">Get Immediate Consultation!</button>
              <div className="rating-row">
                <div className="g-logo">G</div>
                <div>
                  <p className="rating-label">Average Google Rating</p>
                  <p className="rating-stars">★★★★½ <span>4.6 out of 5</span></p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

    {/* Consult Specialities Section */}
<section className="consult-section">
  <div className="consult-header">
    <div>
      <h2>Consult top doctors online for any health concern</h2>
      <p>Private online consultations with verified doctors in all specialists</p>
    </div>
    <button className="btn-view-all">View All Specialities</button>
  </div>
  <div className="consult-grid">
    {[
      { label: 'Period doubts or Pregnancy', icon: 'fa-venus', color: '#f9a8d4' },
      { label: 'Acne, pimple or skin issues', icon: 'fa-face-meh', color: '#fcd34d' },
      { label: 'Performance issues in bed', icon: 'fa-heart-pulse', color: '#f87171' },
      { label: 'Cold, cough or fever', icon: 'fa-head-side-cough', color: '#93c5fd' },
      { label: 'Child not feeling well', icon: 'fa-baby', color: '#86efac' },
      { label: 'Depression or anxiety', icon: 'fa-brain', color: '#c4b5fd' },
    ].map((item, i) => (
      <div className="consult-card" key={i}>
        <div className="consult-img-wrap" style={{ background: item.color + '33' }}>
          <i className={`fas ${item.icon}`} style={{ fontSize: 36, color: item.color }}></i>
        </div>
        <p>{item.label}</p>
        <button className="consult-now-btn">CONSULT NOW</button>
      </div>
    ))}
  </div>
</section>

      {/* Why Curelex Section (about-visual cards only) */}
      <section className="about" id="about">
        <div className="section-header">
          <h2>Why <span>CURELEX</span></h2>
          <p>Built around you, every step of the way</p>
        </div>
        <div className="about-visual">
          <div className="about-card">
            <div className="about-card-icon"><i className="fas fa-hand-holding-heart"></i></div>
            <h4>Patient-Centered Care</h4>
            <p>Your health is our top priority</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon"><i className="fas fa-shield-alt"></i></div>
            <h4>Secure & Private</h4>
            <p>Your data is protected</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon"><i className="fas fa-clock"></i></div>
            <h4>24/7 Availability</h4>
            <p>Healthcare when you need it</p>
          </div>
          <div className="about-card">
            <div className="about-card-icon"><i className="fas fa-globe"></i></div>
            <h4>Pan-India Network</h4>
            <p>Connected across states</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <div className="section-header">
          <h2>Our <span>Services</span></h2>
          <p>Comprehensive healthcare solutions</p>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <i className="fas fa-stethoscope"></i>
            <h3>General Medicine</h3>
            <p>Primary healthcare consultation for common ailments and preventive care.</p>
          </div>
          <div className="service-card">
            <i className="fas fa-heart"></i>
            <h3>Cardiology</h3>
            <p>Heart health monitoring and expert cardiac consultations.</p>
          </div>
          <div className="service-card">
            <i className="fas fa-brain"></i>
            <h3>Neurology</h3>
            <p>Specialized care for neurological conditions and brain health.</p>
          </div>
          <div className="service-card">
            <i className="fas fa-bone"></i>
            <h3>Orthopedics</h3>
            <p>Bone and joint care with expert orthopedic specialists.</p>
          </div>
          <div className="service-card">
            <i className="fas fa-baby"></i>
            <h3>Pediatrics</h3>
            <p>Complete healthcare solutions for infants and children.</p>
          </div>
          <div className="service-card">
            <i className="fas fa-syringe"></i>
            <h3>Vaccination</h3>
            <p>Complete immunization services for all age groups.</p>
          </div>
        </div>
      </section>

      {/* Supported By Section */}
      <section className="supported-by" id="supported">
        <div className="section-header">
          <h2>Supported <span>By</span></h2>
          <p>Our esteemed partners in innovation</p>
        </div>
        <div className="supported-container">
          <div className="supported-card">
            <div className="supported-image">
              <img src="/assets/download (1).jpg" alt="IIIT Allahabad" />
            </div>
            <h3>IIIT Allahabad</h3>
            <p>Indian Institute of Information Technology</p>
            <span className="supported-location">Prayagraj, Uttar Pradesh</span>
          </div>
          <div className="supported-card">
            <div className="supported-image">
              <img src="/assets/download (2).jpg" alt="Startup & Incubation Cell" />
            </div>
            <h3>Startup & Incubation Cell</h3>
            <p>United University</p>
            <span className="supported-location">Supporting Innovation</span>
          </div>
          <div className="supported-card">
            <div className="supported-image">
              <img src="/assets/download (3).jpg" alt="Asian Institute of Technology" />
            </div>
            <h3>Asian Institute of Technology</h3>
            <p>AIT Bangkok</p>
            <span className="supported-location">Bangkok, Thailand</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="section-header">
          <h2>Contact <span>Us</span></h2>
          <p>We'd love to hear from you</p>
        </div>
        <div className="contact-container">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="contact-details">
                <h4>Address</h4>
                <p>IIIT Allahabad Incubation Centre (IIIC)<br />Devghat, Jhalwa, Prayagraj, Uttar<br />Pradesh, 211015</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-envelope"></i></div>
              <div className="contact-details">
                <h4>Email</h4>
                <p>info.curelex@gmail.com</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fas fa-phone-alt"></i></div>
              <div className="contact-details">
                <h4>Phone</h4>
                <p>+91 788 089 4345</p>
              </div>
            </div>
            <div className="social-links">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="https://www.linkedin.com/company/curelex-healthtech/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://www.instagram.com/curelexofficial?utm_source=qr&igsh=MWNobGQzMHdhdTRpNg==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="contact-map" style={{ lineHeight: 0, fontSize: 0, padding: 0, margin: 0 }}>
            <iframe
              src="https://www.google.com/maps?q=IIIT+Allahabad+Incubation+Centre+Devghat+Jhalwa+Prayagraj+211015&output=embed"
              width="100%"
              height="300"
              style={{ display: 'block', border: 0, borderRadius: 12, margin: 0, padding: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CURELEX Location Map"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <Link to="/" className="logo">
              <img className="logo-img" src="/assets/logo.png" alt="CURELEX" />
            </Link>
            <p>Your trusted healthcare partner</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
              <li><Link to="/about">About Us</Link></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>Services</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 CURELEX. All rights reserved.</p>
        </div>
      </footer>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="modal active" id="roleSelectionModal">
          <div className="modal-overlay" onClick={() => setShowRoleModal(false)}></div>
          <div className="modal-container modal-small">
            <div className="auth-header">
              <h2>Select Login Type</h2>
              <p>Choose your account type to proceed</p>
            </div>
            <div className="role-selection">
              <button className="role-card" onClick={() => { setShowRoleModal(false); setShowLoginModal(true); setActiveTab('patient-login'); }}>
                <div className="role-icon"><i className="fas fa-user-injured"></i></div>
                <h3>Patient</h3>
                <p>Access your health records and connect with doctors</p>
              </button>
              <button className="role-card" onClick={() => { setShowRoleModal(false); setShowLoginModal(true); setActiveTab('doctor-login'); }}>
                <div className="role-icon"><i className="fas fa-user-md"></i></div>
                <h3>Doctor</h3>
                <p>Manage appointments and patient consultations</p>
              </button>
            </div>
            <div className="demo-credentials" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', marginBottom: '5px' }}><strong>Demo Credentials:</strong></p>
              <p style={{ fontSize: '11px' }}>Patient: patient@curelex.com / patient123</p>
              <p style={{ fontSize: '11px' }}>Doctor: doctor@curelex.com / doctor123</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal active" id="loginModal">
          <div className="modal-overlay" onClick={() => setShowLoginModal(false)}></div>
          <div className="modal-container">
            <div className="auth-tabs">
              <button className={`auth-tab ${activeTab === 'patient-login' ? 'active' : ''}`} onClick={() => setActiveTab('patient-login')}>Patient</button>
              <button className={`auth-tab ${activeTab === 'doctor-login' ? 'active' : ''}`} onClick={() => setActiveTab('doctor-login')}>Doctor</button>
            </div>

            {activeTab === 'patient-login' && (
              <div className="auth-form active">
                <h2>Patient Login</h2>
                <form onSubmit={handlePatientLogin}>
                  <div className="form-group">
                    <label htmlFor="patientEmail">Email ID</label>
                    <input type="email" id="patientEmail" placeholder="Enter your email" value={patientLogin.email} onChange={(e) => setPatientLogin({ ...patientLogin, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="patientPassword">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={passwordVisible.patient ? 'text' : 'password'} id="patientPassword" placeholder="Enter your password" value={patientLogin.password} onChange={(e) => setPatientLogin({ ...patientLogin, password: e.target.value })} style={{ width: '100%', paddingRight: '35px' }} required />
                      <i className={`fa-solid ${passwordVisible.patient ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setPasswordVisible({ ...passwordVisible, patient: !passwordVisible.patient })} style={{ position: 'absolute', right: '10px', top: '12px', cursor: 'pointer' }} />
                    </div>
                  </div>
                  <div className="form-footer">
                    <a href="#" className="forgot-link">Forgot Password?</a>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                </form>
                <p className="auth-switch">Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowLoginModal(false); setShowPatientSignUp(true); }}>Sign Up</a></p>
              </div>
            )}

            {activeTab === 'doctor-login' && (
              <div className="auth-form active">
                <h2>Doctor Login</h2>
                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <p>Doctor accounts require admin approval before first login.</p>
                </div>
                <form onSubmit={handleDoctorLogin}>
                  <div className="form-group">
                    <label htmlFor="doctorEmail">Email ID</label>
                    <input type="email" id="doctorEmail" placeholder="Enter your email" value={doctorLogin.email} onChange={(e) => setDoctorLogin({ ...doctorLogin, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="doctorPasswordLogin">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={passwordVisible.doctor ? 'text' : 'password'} id="doctorPasswordLogin" placeholder="Enter your password" value={doctorLogin.password} onChange={(e) => setDoctorLogin({ ...doctorLogin, password: e.target.value })} style={{ width: '100%', paddingRight: '35px' }} required />
                      <i className={`fa-solid ${passwordVisible.doctor ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setPasswordVisible({ ...passwordVisible, doctor: !passwordVisible.doctor })} style={{ position: 'absolute', right: '10px', top: '12px', cursor: 'pointer' }} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                </form>
                <p className="auth-switch">New doctor? <a href="#" onClick={(e) => { e.preventDefault(); setShowLoginModal(false); setShowDoctorSignUp(true); }}>Register Here</a></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Sign Up Modal */}
      {showPatientSignUp && (
        <div className="modal active" id="patientSignUpModal">
          <div className="modal-overlay" onClick={() => setShowPatientSignUp(false)}></div>
          <div className="modal-container modal-large">
            <div className="auth-header">
              <h2>Patient Registration</h2>
              <p>Create your account to get started</p>
            </div>
            <form onSubmit={handlePatientSignUp}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="patientFullName">Full Name *</label>
                  <input type="text" id="patientFullName" placeholder="Enter your full name" value={patientSignUp.fullName} onChange={(e) => setPatientSignUp({ ...patientSignUp, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="patientMobile">Mobile Number *</label>
                  <input type="tel" id="patientMobile" placeholder="Enter mobile number" value={patientSignUp.mobile} onChange={(e) => setPatientSignUp({ ...patientSignUp, mobile: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="patientEmailSignup">Email ID *</label>
                  <input type="email" id="patientEmailSignup" placeholder="Enter your email" value={patientSignUp.email} onChange={(e) => setPatientSignUp({ ...patientSignUp, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="patientCreatePassword">Create Password *</label>
                  <input type="password" id="patientCreatePassword" placeholder="Create password" value={patientSignUp.password} onChange={(e) => setPatientSignUp({ ...patientSignUp, password: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
            </form>
            <p className="auth-switch">Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setShowPatientSignUp(false); setShowLoginModal(true); }}>Sign In</a></p>
          </div>
        </div>
      )}

      {/* Doctor Sign Up Modal */}
      {showDoctorSignUp && (
        <div className="modal active" id="doctorSignUpModal">
          <div className="modal-overlay" onClick={() => setShowDoctorSignUp(false)}></div>
          <div className="modal-container modal-large">
            <div className="auth-header">
              <h2>Doctor Registration</h2>
              <p>Join our network of medical professionals</p>
            </div>
            <form onSubmit={handleDoctorSignUp}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="doctorFullName">Doctor Name *</label>
                  <input type="text" id="doctorFullName" placeholder="Enter your full name" value={doctorSignUp.fullName} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorEmailSignup">Email *</label>
                  <input type="email" id="doctorEmailSignup" placeholder="Enter your email" value={doctorSignUp.email} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorAge">Age *</label>
                  <input type="number" id="doctorAge" placeholder="Enter your age" min="25" max="100" value={doctorSignUp.age} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, age: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorGender">Gender *</label>
                  <select id="doctorGender" value={doctorSignUp.gender} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, gender: e.target.value })} required>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="doctorSpecialization">Specialization *</label>
                  <select id="doctorSpecialization" value={doctorSignUp.specialization} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, specialization: e.target.value })} required>
                    <option value="">Select specialization</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="ENT">ENT</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Gynecology">Gynecology</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="doctorRegNumber">Medical Registration Number *</label>
                  <input type="text" id="doctorRegNumber" placeholder="Enter registration number" value={doctorSignUp.regNumber} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, regNumber: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorRegState">Registration State *</label>
                  <input type="text" id="doctorRegState" placeholder="Enter registration state" value={doctorSignUp.regState} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, regState: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorHospital">Current Practice Hospital *</label>
                  <input type="text" id="doctorHospital" placeholder="Enter hospital name" value={doctorSignUp.hospital} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, hospital: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorExperience">Years of Experience *</label>
                  <input type="number" id="doctorExperience" placeholder="Enter years of experience" min="0" max="50" value={doctorSignUp.experience} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, experience: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorPatients">Total Patients Treated *</label>
                  <input type="number" id="doctorPatients" placeholder="Enter total patients" min="0" value={doctorSignUp.patients} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, patients: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorPhoto">Professional Photo *</label>
                  <input type="file" id="doctorPhoto" accept="image/*" onChange={(e) => setDoctorSignUp({ ...doctorSignUp, photo: e.target.files[0] })} />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorCert">Registration Certificate *</label>
                  <input type="file" id="doctorCert" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDoctorSignUp({ ...doctorSignUp, cert: e.target.files[0] })} />
                </div>
                <div className="form-group">
                  <label htmlFor="doctorPasswordSignup">Create Password *</label>
                  <input type="password" id="doctorPasswordSignup" placeholder="Create password" value={doctorSignUp.password} onChange={(e) => setDoctorSignUp({ ...doctorSignUp, password: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Submitting...' : 'Submit for Approval'}</button>
            </form>
            <p className="auth-info">
              <i className="fas fa-clock"></i> Your account will be reviewed by admin before activation.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;