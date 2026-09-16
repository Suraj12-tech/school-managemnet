import { useState } from "react";

export default function PasswordField({ value, onChange, placeholder, required = false, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.6 4.4 9.8 7a17 17 0 0 1-3.1 4.1" />
              <path d="M6.2 6.2C4.3 7.5 3 9.4 2.2 12c1.2 2.6 4.6 7 9.8 7a10.7 10.7 0 0 0 3.1-.5" />
            </>
          ) : (
            <>
              <path d="M2.2 12C3.4 9.4 6.8 5 12 5s8.6 4.4 9.8 7c-1.2 2.6-4.6 7-9.8 7S3.4 14.6 2.2 12Z" />
              <circle cx="12" cy="12" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
