import express, { Request } from 'express'
import cors from 'cors'
import { routes } from "./routes"
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: 'http://localhost:5173', // ou ['http://localhost:5173'] se quiser permitir múltiplos
    credentials: true
  }));
app.use(express.json())
app.use(cookieParser())
app.use(routes)

export { app }