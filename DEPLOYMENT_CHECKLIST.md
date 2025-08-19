# Production Deployment Checklist

## ✅ Pre-Deployment Checks
- [ ] MongoDB Atlas connection string is correct
- [ ] All environment variables are set
- [ ] SSL certificates are configured (if using HTTPS)
- [ ] Domain DNS is pointing to the server
- [ ] Firewall allows port 3001 (or configured port)

## 🚀 Deployment Steps
1. Upload all files to production server
2. Install dependencies: `npm install`
3. Set environment variables
4. Start server: `npm run prod` or `./start-production.sh`
5. Test all endpoints

## 🧪 Post-Deployment Tests
- [ ] Main page loads correctly
- [ ] Static files (CSS, JS, images) load
- [ ] API endpoints respond
- [ ] Database operations work
- [ ] Payment gateway integration works
- [ ] Email functionality works

## 🔧 Troubleshooting
- Check server logs: `tail -f server.log`
- Test MongoDB connection: `node test-mongodb-connection.js`
- Run health check: `node health-check.js`
- Run comprehensive tests: `node test-server.js`

## 📞 Support
If issues persist, check:
1. Server logs for error messages
2. MongoDB Atlas dashboard for connection issues
3. Network connectivity and firewall settings
4. Environment variable configuration
