import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { createApp } from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;

async function bootstrap() {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
