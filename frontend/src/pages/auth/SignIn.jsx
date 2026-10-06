import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrorsFrom } from './errors.js';

function Field({ id, label, type = 'text', value, onChange, error, autoComplete, required, placeholder }) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-label">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </label>
  );
}

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from || '/app/dashboard';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await signIn(identifier.trim(), password);
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form-wrap">
      <header className="auth-form-head">
        <p className="auth-kicker">Welcome back</p>
        <h2>Sign in to your workspace</h2>
        <p>Pick up where your team left off — plan, tasks, approvals, and risks in one place.</p>
      </header>

      {errors.form && <p className="auth-form-error" role="alert">{errors.form}</p>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Field
          id="identifier"
          label="Username or email"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={errors.identifier || errors.username || errors.credentials}
          autoComplete="username"
          required
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <button className="button primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={14} className="spinning" /> : <LogIn size={14} />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        No account yet? <Link to="/signup">Create one</Link>.
      </p>
    </div>
  );
}
