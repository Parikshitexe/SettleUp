import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back!</h2>
        <p style={styles.subtitle}>Login to continue to SettleUp</p>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={onChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={onChange}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
  <Link to="/forgot-password" style={{ color: '#1cc29f', fontSize: '14px', textDecoration: 'none' }}>
    Forgot Password?
  </Link>
</div>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '450px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    color: '#333',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 30px 0',
    fontSize: '14px',
    color: '#666',
    textAlign: 'center'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666'
  },
  link: {
    color: '#1cc29f',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Login;