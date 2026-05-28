import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import productsRoutes from './routes/products';
import customersRoutes from './routes/customers';
import ordersRoutes from './routes/orders';
import statisticsRoutes from './routes/statistics';
import documentsRoutes from './routes/documents';
import journalEntriesRoutes from './routes/journalEntries';
import cashBankRoutes from './routes/cashBank';

require('dotenv').config();

const app = express();
app.use(cors({
    credentials: true,
}));

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.use('/products', productsRoutes);
app.use('/customers', customersRoutes);
app.use('/orders', ordersRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/documents', documentsRoutes);
app.use('/journalEntries', journalEntriesRoutes);
app.use('/cashBank', cashBankRoutes);