import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI in .env");

const globalForMongo = globalThis;

if (!globalForMongo._mongo) {
  const client = new MongoClient(uri);
  globalForMongo._mongo = { client, db: client.db("booknook") };
}

export const db = globalForMongo._mongo.db;
export const books = db.collection("books");
export const borrows = db.collection("borrows");