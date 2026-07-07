# Troubleshooting Guide

## Login Server Error

If you're experiencing a "server error" while trying to login, check the following:

### 1. Backend Server is Running
- Make sure the backend server is running on port 5000
- Check terminal for any error messages
- Verify: `http://localhost:5000/api/health` returns `{ status: 'OK' }`

### 2. MongoDB Connection
- Ensure MongoDB is installed and running
- Check MongoDB connection string in `.env` file:
  ```
  MONGODB_URI=mongodb://localhost:27017/training_center
  ```
- For MongoDB Atlas, use your connection string

### 3. Environment Variables
Create a `.env` file in the `backend` directory with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/training_center
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

**Important:** Set a strong JWT_SECRET (at least 32 characters)

### 4. CORS Issues
- Frontend should be running on port 3000
- Backend should be running on port 5000
- Check browser console for CORS errors

### 5. Check Backend Logs
Look for specific error messages in the backend terminal:
- MongoDB connection errors
- JWT_SECRET missing warnings
- Route errors

### 6. Common Issues

**"MongoDB connection error"**
- Start MongoDB service: `mongod` or `brew services start mongodb-community`
- Check if MongoDB is running: `mongosh` or `mongo`

**"JWT_SECRET is not set"**
- Add JWT_SECRET to `.env` file
- Restart the backend server

**"Invalid credentials"**
- Make sure you've registered an account first
- Check email and password are correct

**"Network Error" or "Connection refused"**
- Verify backend server is running
- Check if port 5000 is available
- Verify frontend proxy configuration in `vite.config.js`

### 7. Test Backend Directly
Test the login endpoint directly:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 8. Clear Browser Cache
- Clear localStorage: Open browser console and run `localStorage.clear()`
- Clear browser cache and cookies
- Try incognito/private mode

### 9. Check Browser Console
Open browser DevTools (F12) and check:
- Network tab for failed requests
- Console tab for JavaScript errors
- Check request/response details

### 10. Reinstall Dependencies
If issues persist:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Still Having Issues?

1. Check backend terminal for detailed error messages
2. Check browser console (F12) for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB is running and accessible
5. Make sure both servers are running (backend on 5000, frontend on 3000)

