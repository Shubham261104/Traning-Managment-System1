# Backend Setup Instructions

## Quick Setup

### 1. Create .env File

Create a `.env` file in the `backend` directory with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/training_center
JWT_SECRET=training_center_jwt_secret_key_2024_change_in_production_abc123xyz789
NODE_ENV=development
```

**Important:** 
- Replace the `JWT_SECRET` with a secure random string (at least 32 characters)
- For production, use a strong, randomly generated secret
- Never commit the `.env` file to version control

### 2. Generate a Secure JWT_SECRET

You can generate a secure JWT_SECRET using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator and copy the result.

### 3. MongoDB Setup

Make sure MongoDB is installed and running:

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
# Or if installed as a service, it should start automatically
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Check MongoDB:**
```bash
mongosh
# or
mongo
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Start the Server

```bash
npm run dev
```

You should see:
- "MongoDB Connected"
- "Server running on port 5000"

If you see "WARNING: JWT_SECRET is not set", make sure the `.env` file exists and contains JWT_SECRET.

## Troubleshooting

### "Server configuration error"
- Make sure `.env` file exists in the `backend` directory
- Check that `JWT_SECRET` is set in `.env`
- Restart the server after creating/updating `.env`

### "MongoDB connection error"
- Make sure MongoDB is running
- Check the `MONGODB_URI` in `.env`
- For MongoDB Atlas, use your connection string

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

