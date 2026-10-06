import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrorsFrom } from './errors.js';

const EMPTY = {
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  password_confirm: '',
};

export default function CreateAccount() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await signUp({
        ...values,
        email: values.email.trim(),
        username: values.username.trim(),
      });
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form-wrap">
      <header className="auth-form-head">
        <p className="auth-kicker">Get started</p>
        <h2>Create your account</h2>
        <p>Set up access to the delivery workspace. A project owner grants you project access once you are in.</p>
      </header>

      {errors.form && <p className="auth-form-error" role="alert">{errors.form}</p>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-row">
          <label className="auth-field" htmlFor="first_name">
            <span className="auth-label">First name</span>
            <input id="first_name" name="first_name" value={values.first_name} onChange={update('first_name')} autoComplete="given-name" required />
            {errors.first_name && <span className="auth-field-error">{errors.first_name}</span>}
          </label>
          <label className="auth-field" htmlFor="last_name">
            <span className="auth-label">Last name</span>
            <input id="last_name" name="last_name" value={values.last_name} onChange={update('last_name')} autoComplete="family-name" required />
            {errors.last_name && <span className="auth-field-error">{errors.last_name}</span>}
          </label>
        </div>

        <label className="auth-field" htmlFor="email">
          <span className="auth-label">Work email</span>
          <input id="email" name="email" type="email" value={values.email} onChange={update('email')} autoComplete="email" required />
          {errors.email && <span className="auth-field-error">{errors.email}</span>}
        </label>

        <label className="auth-field" htmlFor="username">
          <span className="auth-label">Username</span>
          <input id="username" name="username" value={values.username} onChange={update('username')} autoComplete="username" required />
          {errors.username && <span className="auth-field-error">{errors.username}</span>}
        </label>

        <label className="auth-field" htmlFor="new-password">
          <span className="auth-label">Password</span>
          <input
            id="new-password"
            name="password"
            type="password"
            value={values.password}
            onChange={update('password')}
            autoComplete="new-password"
            required
            aria-describedby={values.password ? 'password-hint' : undefined}
          />
          {errors.password
            ? <span className="auth-field-error">{errors.password}</span>
            : values.password && (
              <span className="auth-field-hint" id="password-hint">
                Use 8+ characters and avoid common passwords.
              </span>
            )}
        </label>

        <label className="auth-field" htmlFor="password_confirm">
          <span className="auth-label">Confirm password</span>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            value={values.password_confirm}
            onChange={update('password_confirm')}
            autoComplete="new-password"
            required
          />
          {errors.password_confirm && <span className="auth-field-error">{errors.password_confirm}</span>}
        </label>

        <button className="button primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? <Loader2 size={14} className="spinning" /> : <UserPlus size={14} />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>.
      </p>
    </div>
  );
}
