import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import Routes from './routes/index.js'; 
import rateLimit from 'express-rate-limit';

const app = express();

// Parse the request body as JSON and URL encoded.
app.use(express.json());
// extended option allow to parse nested objects
app.use(express.urlencoded({ extended: true }));

// Morgon used to Log Requests
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set security HTTP headers
app.use(helmet());

// Define Limit of Request
const limiter = rateLimit({
    windowMs: process.env.DEFINE_DURATION * 60 * 1000, 
    max: process.env.MAX_REQUEST,
    standardHeaders: true,
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate Limiter for All Request
app.use(limiter);

// allows requests from another origin
app.use(cors());

//  main route of the application
app.use('/api', Routes);

const PORT = process.env.PORT || 3000;

// Start serve on Specified Port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

