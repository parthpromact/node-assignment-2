import express from 'express';
import { getGoogleAuthUrl, getUsers, handleGoogleCallback, login, register } from '../Controller/UserController.js';
import { tokenChecker } from '../middleware/tokenChecker.js';
import { deleteMessage, editMessage, retrieveConversationHistory, sendMessage } from '../Controller/MessageController.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { fetchLogs } from '../Controller/LogsController.js';

const router = express.Router();

// Register User Route
router.post('/register', requestLogger,register);

// Login User Route
router.post('/login', requestLogger, login);

// Retrieve All Users Route
router.get('/users', tokenChecker, requestLogger, getUsers);

// Send Message Route
router.post('/messages', tokenChecker, requestLogger, sendMessage);

// Edit Message Route
router.put('/messages/:messageId', tokenChecker, requestLogger, editMessage);

// Delete Message Route
router.delete('/messages/:messageId', tokenChecker, requestLogger, deleteMessage);

// Conversation History
router.get('/messages', tokenChecker, requestLogger, retrieveConversationHistory);

// Fetch Logs
router.get('/logs', tokenChecker, requestLogger, fetchLogs);

// Get Google Auth URL
router.get('/google-auth-url', getGoogleAuthUrl);

// Handle google callback
router.get('/login-callback', handleGoogleCallback);

export default router;
