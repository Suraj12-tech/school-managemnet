# Quick Start Testing Guide

## 🚀 Starting the Application

### Prerequisites
- Node.js (with npm)
- Java 21
- MySQL (or Docker)

### Option 1: Using Docker Compose (Recommended)
```powershell
# Start MySQL database
docker compose up -d

# Wait for MySQL to be ready (check logs)
docker compose logs -f
```

### Option 2: Manual MySQL
Ensure MySQL is running on localhost:3306 with appropriate credentials.

### Starting Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Wait for message: `Started SchoolEnterpriseApplication in X.XXX seconds`

### Starting Frontend
```powershell
cd frontend
npm install  # if not already installed
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## 📋 Quick Test Flow

### Test 1: Login Page (2 minutes)
1. Open http://localhost:5173/login
2. Verify page shows:
   - ✅ "Admin Login" title
   - ✅ Username field
   - ✅ Password field (with show/hide toggle)
   - ✅ "Forgot password?" link (in blue, at bottom)
3. Click "Forgot password?" link
4. Should navigate to http://localhost:5173/forgot-password

### Test 2: Forgot Password - Email Request (3 minutes)
1. On Forgot Password page, verify you see:
   - ✅ "Reset Password" title
   - ✅ Email Address input
   - ✅ "Send Reset Instructions" button
   - ✅ "Enter Token Instead" button below
2. Enter email: `admin@school.com`
3. Click "Send Reset Instructions"
4. Verify:
   - ✅ Button shows "Sending..." while processing
   - ✅ Success message appears
   - ✅ Page shows token input form

### Test 3: Forgot Password - Token Entry (3 minutes)
1. After email request, page should show:
   - ✅ Reset Token input field
   - ✅ New Password input field
   - ✅ Confirm New Password input field
   - ✅ "Update Password" button
   - ✅ "Request Token by Email Instead" button

### Test 4: Test Token Option (2 minutes)
1. Click "Request Token by Email Instead"
2. Form should reset and show:
   - ✅ Email Address field again
   - ✅ "Send Reset Instructions" button
   - ✅ "Enter Token Instead" button

### Test 5: Password Reset (3 minutes)
**Note: Only if SMTP is configured**
1. Check email inbox for reset token
2. Copy the token (long alphanumeric string)
3. Return to browser (should still be on token entry form)
4. Paste token in "Reset Token" field
5. Enter new password: `NewPassword@123` (8+ chars)
6. Confirm password: `NewPassword@123`
7. Click "Update Password"
8. Verify:
   - ✅ Button shows "Updating..."
   - ✅ Redirects to Login page
   - ✅ Success message displayed

### Test 6: Login with New Password (2 minutes)
1. On Login page, see success message
2. Enter username: `admin`
3. Enter password: `NewPassword@123` (the one you just set)
4. Click "Login"
5. Verify:
   - ✅ Dashboard loads
   - ✅ Logged in successfully

### Test 7: Login with Old Password (1 minute)
1. If you want to reset password again:
   - Click account dropdown → Logout
   - Try logging in with old password (e.g., `Admin@123`)
   - Should fail with "Invalid credentials"

## 🐛 Troubleshooting

### Frontend not loading
```powershell
cd frontend
rm -r node_modules
npm install
npm run dev
```

### Backend not starting
- Check Java version: `java -version` (should be 21+)
- Check if port 8080 is available: `netstat -ano | findstr :8080`
- Check MySQL connection: http://localhost:8080/swagger-ui.html

### Email not being sent
- Ensure SMTP credentials in `application.properties` or environment variables
- Check backend logs for email errors
- Temporarily skip email by using token directly

### Form not responding
- Clear browser cache: Press `Ctrl+Shift+Delete`
- Check browser console for errors: Press `F12`
- Try different browser

## 🧪 Automated Test Commands

### Build Check (Verify no syntax errors)
```powershell
cd frontend
npm run build
# Look for "✓ built in XXXms" - means success
```

### Lint Check (Code quality)
```powershell
cd frontend
npm run lint  # if configured
```

### Backend Unit Tests
```powershell
cd backend
.\mvnw.cmd test
```

## 📊 Expected Results

### Successful Flow
```
Login Page → Click "Forgot password?" →
Forgot Password (Email) → Enter email, send →
Success Message + Token Form →
Enter token and new password →
Password Updated + Redirect to Login →
Login with new password → Dashboard
```

### Error Cases (Should Handle Gracefully)
- Invalid email → "No user with that email"
- Expired token → "Reset token has expired"
- Invalid token → "Invalid reset token"
- Password mismatch → "Passwords do not match"
- Short password → "Password must be at least 8 characters"

## 💾 Default Credentials

**Test User**: 
- Username: `admin`
- Initial Password: `Admin@123`

**Note**: After successful password reset, use the new password instead.

## 📚 Documentation Files

- `AUTHENTICATION_UI_UPDATE.md` - Detailed test guide with all scenarios
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation summary
- `README.md` - Main project README (if exists)

## ✅ Final Verification Checklist

Before considering implementation complete:
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Login page displays correctly
- [ ] "Forgot password?" link navigates correctly
- [ ] Email request form works
- [ ] Token entry form works
- [ ] Password reset redirects to login
- [ ] New password works for login
- [ ] Old password no longer works
- [ ] Responsive design works on mobile
- [ ] Error messages display correctly
- [ ] All links are clickable and styled properly

## 🎉 Complete!

Once all checks pass, the authentication UI update is complete and ready for:
- Production deployment
- User training
- Documentation updates
- Security audit (if required)

---

**Quick Reference**:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html
- Database: localhost:3306

**Get Help**: Check the detailed test guide in AUTHENTICATION_UI_UPDATE.md

