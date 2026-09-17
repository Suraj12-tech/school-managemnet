# Authentication UI Update - Test Guide

## Overview
The School Administrator Portal authentication UI has been updated to separate Login and Forgot Password into distinct flows, providing a cleaner and more administrator-friendly experience.

## Changes Made

### 1. **LoginPage.jsx** (Simplified & Focused)
- **Purpose**: Simple, clean login form for administrators
- **Features**:
  - Username/Email input field
  - Password input field with show/hide toggle
  - Login button with loading state
  - Error and success message displays
  - "Forgot password?" link styled as a footer link (clear and prominent)
  - Displays success message when redirected from password reset

### 2. **ForgotPasswordPage.jsx** (Dedicated Password Reset Flow)
- **Purpose**: Handles the complete password reset workflow
- **Flow**:
  - **Step 1 (Default)**: Request reset token by email
    - User enters email address
    - System sends reset token to email (via backend SMTP)
    - Success message displayed
  - **Alternative Path**: User can skip email request and enter token directly
    - Button: "Enter Token Instead" switches to token input mode
  - **Step 2**: Reset password with token
    - User enters the reset token received via email
    - User enters new password (min 8 characters)
    - User confirms new password
    - System validates and updates password
    - Redirects to Login with success message
    - User can switch back to email request mode if needed
- **Back to Login**: Clear "← Back to Login" link for easy navigation

### 3. **PasswordField.jsx** (Enhanced)
- Added `id` prop support for better accessibility
- Maintains existing password visibility toggle functionality
- Supports placeholder text for improved UX

### 4. **styles.css** (Enhanced Login Styling)
- Added `.login-footer` container for better layout control
- Added `.forgot-password-link` styling for consistent, accessible link styling
- Link hovers with underline for clarity
- Focus-visible states for keyboard navigation

## Testing Instructions

### Prerequisites
1. Backend running on http://localhost:8080
2. Frontend running on http://localhost:5173
3. MySQL database configured with sample data
4. SMTP credentials configured in backend for email delivery

### Test Scenario 1: Login Page Simplicity
1. Navigate to http://localhost:5173/login
2. Verify page shows:
   - "Admin Login" title
   - "Stage 1 — Administration & Finance" subtitle
   - Username field
   - Password field with show/hide toggle
   - Login button
   - "Forgot password?" link in footer (styled in accent color)
3. Click "Forgot password?" link - should navigate to /forgot-password

### Test Scenario 2: Forgot Password - Request Token by Email
1. Navigate to http://localhost:5173/forgot-password
2. Verify page shows:
   - "Reset Password" title
   - Clear instructions
   - Email input field
   - "Send Reset Instructions" button
   - "Enter Token Instead" button below
3. Enter valid admin email (e.g., admin@school.com)
4. Click "Send Reset Instructions"
5. Verify:
   - Loading state shows "Sending..."
   - Success message displays
   - Page transitions to token entry mode
   - Check email for reset token (if SMTP configured)

### Test Scenario 3: Forgot Password - Alternative Token Entry
1. From the Email Request step, click "Enter Token Instead"
2. Page should show:
   - Reset Token input field
   - New Password field
   - Confirm New Password field
   - "Update Password" button
   - "Request Token by Email Instead" button

### Test Scenario 4: Password Reset & Validation
1. Enter the reset token from email
2. Enter new password (must be >= 8 characters)
3. Confirm new password
4. Verify validation:
   - Passwords must match (error if not)
   - Token must be valid (error if expired or invalid)
5. Click "Update Password"
6. Verify:
   - Loading state shows "Updating..."
   - Success redirect to /login
   - Success message displayed

### Test Scenario 5: Complete Flow - Login → Forgot Password → Reset → Login
1. Start at Login page
2. Note current password (e.g., Admin@123)
3. Click "Forgot password?"
4. Enter email address
5. Send reset instructions
6. Copy token from email
7. Enter token and new password
8. Click "Update Password"
9. Redirected to Login with success message
10. Try logging in with **old password** → should fail
11. Log in with **new password** → should succeed
12. Verify dashboard loads

### Test Scenario 6: Navigation & Edge Cases
1. From Login, navigate to Forgot Password - "Back to Login" link works
2. From Forgot Password Step 2, click "Request Token by Email Instead" - resets form
3. Enter invalid email - verify backend error handling
4. Enter expired/invalid token - verify error message
5. Password mismatch - verify error message
6. Test with keyboard navigation (Tab key, Enter to submit)

### Test Scenario 7: Error Handling
1. Test with:
   - Non-existent email (should show "No user with that email")
   - Expired token (should show "Reset token has expired")
   - Invalid token (should show "Invalid reset token")
   - Mismatched passwords (should show "Passwords do not match")
   - Short password < 8 chars (should show length requirement)

### Test Scenario 8: Responsive Design
1. Test on desktop (1920px width)
2. Test on tablet (768px width)
3. Test on mobile (375px width)
4. Verify:
   - Forms remain readable
   - Buttons remain clickable
   - No horizontal scrolling

## Backend API Endpoints (Unchanged)

### POST /api/auth/login
- Request: `{ username, password }`
- Response: `{ token, userId, username, fullName, roles, permissions }`

### POST /api/auth/forgot-password
- Request: `{ email }`
- Response: `{ message: "Password reset instructions sent to your email" }`
- Note: Backend sends email with reset token (valid for 2 hours)

### POST /api/auth/reset-password
- Request: `{ token, newPassword, confirmPassword }`
- Response: `{ message: "Password updated" }`
- Note: Validates token expiry and password match

### POST /api/auth/logout
- Revokes current session

### GET /api/auth/me
- Returns current authenticated user info

## Accessibility Features
- ✅ Proper label-input associations with htmlFor/id
- ✅ Password visibility toggle with aria-label
- ✅ ARIA roles for error/status messages
- ✅ Focus-visible states for keyboard navigation
- ✅ Semantic HTML structure

## Security Considerations (Unchanged)
- ✅ Backend validates all tokens
- ✅ Tokens expire after 2 hours
- ✅ One-time use tokens (cleared after reset)
- ✅ All sessions revoked on password change
- ✅ Password hashing with bcrypt
- ✅ HTTPS recommended for production

## Architecture Compliance
- ✅ No changes to backend authentication logic
- ✅ No changes to API contracts
- ✅ No changes to security implementation
- ✅ No authentication duplication
- ✅ Maintains existing project conventions
- ✅ Follows React + JavaScript standards
- ✅ Consistent with existing styling patterns

## Files Modified
1. `frontend/src/pages/LoginPage.jsx` - Simplified to focus on login only
2. `frontend/src/pages/ForgotPasswordPage.jsx` - Enhanced two-step reset flow
3. `frontend/src/components/PasswordField.jsx` - Added id prop support
4. `frontend/src/styles.css` - Added login-footer and link styling

## Notes
- All backend logic remains unchanged
- Email delivery requires SMTP configuration
- Reset tokens are valid for 2 hours
- Password reset revokes all active sessions
- No breaking changes to existing code

## Troubleshooting

### Email not received
- Verify SMTP credentials in backend
- Check backend logs for email sending errors
- Test with `TEST_MODE=true` if available

### Token expiration
- Tokens expire after 2 hours
- User must request new token if expired
- Error message clearly indicates expiration

### Cannot login after reset
- Ensure using NEW password (not old one)
- Check for capitalization
- Verify credentials stored correctly

### Styling issues
- Clear browser cache
- Verify styles.css is loaded
- Check browser DevTools for CSS errors

