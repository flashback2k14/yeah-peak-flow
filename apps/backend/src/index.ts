import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
