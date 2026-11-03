import "dotenv/config";
import { books } from "./db.js";

const OWNER = { name: "Suha", email: "suhaaa767@gmail.com" };

const seedBooks = [
  {
    title: "The Book of Disquiet",
    author: "Fernando Pessoa",
    category: "Fiction",
    description:
      "A masterpiece of literary modernism, this is the autobiography of a man who never existed, exploring the nature of identity, memory, and the beauty of melancholy.",
    image: "https://i.ibb.co/PSrmCTC/images.jpg",
    totalCopies: 3,
  },
  {
    title: "The Waves",
    author: "Virginia Woolf",
    category: "Fiction",
    description:
      "Six characters speak in soliloquies, their voices interwoven with the rhythmic waves of the sea. A radical and poetic exploration of consciousness and time.",
    image: "https://i.ibb.co/FqBp4vHF/images-1.jpg",
    totalCopies: 2,
  },
  {
    title: "The Unbearable Lightness of Being",
    author: "Milan Kundera",
    category: "Fiction",
    description:
      "A profound meditation on love, politics, and the eternal return, set against the backdrop of the Prague Spring.",
    image: "https://i.ibb.co/PG4fs7Pf/images-2.jpg",
    totalCopies: 2,
  },
  {
    title: "Ways of Seeing",
    author: "John Berger",
    category: "Others",
    description:
      "A brilliant and revolutionary look at how we view art, media, and the world around us. A classic text that changed the way a generation thought about images.",
    image: "https://i.ibb.co/QvQk4RTv/9780141035796.jpg",
    totalCopies: 3,
  },
  {
    title: "The Stranger",
    author: "Albert Camus",
    category: "Fiction",
    description:
      "Through the story of an ordinary man unwittingly drawn into a senseless murder, Camus explores the nakedness of man faced with the absurd.",
    image: "https://i.ibb.co/qYdG3cyz/9780679720201.jpg",
    totalCopies: 2,
  },
  {
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    category: "Fiction",
    description:
      "A sentimental story from the diary of a dreamer, chronicling four nights and a morning in St. Petersburg, and a love that exists only in the imagination.",
    image: "https://i.ibb.co/5Wcm22cF/255c8ebccddac8fb6864884438493c37178e34b8-9781398868014.jpg",
    totalCopies: 3,
  },
];

if (seedBooks.some((b) => b.image.startsWith("PASTE"))) {
  console.log("Paste a real image link for every book first.");
  process.exit(1);
}

const now = Date.now();
let added = 0;

for (const [index, book] of seedBooks.entries()) {
  const exists = await books.findOne({ title: book.title });
  if (exists) {
    console.log(`Skipping "${book.title}" (already in the database)`);
    continue;
  }

  await books.insertOne({
    ...book,
    availableCopies: book.totalCopies,
    addedBy: OWNER,
    createdAt: new Date(now - index * 60 * 1000),
  });
  added++;
}

console.log(`Added ${added} books`);
process.exit(0);

// https://i.ibb.co/PSrmCTC/images.jpg
// https://i.ibb.co/PG4fs7Pf/images-2.jpg
// https://i.ibb.co/FqBp4vHF/images-1.jpg
// https://i.ibb.co/qYdG3cyz/9780679720201.jpg
// https://i.ibb.co/5Wcm22cF/255c8ebccddac8fb6864884438493c37178e34b8-9781398868014.jpg
// https://i.ibb.co/QvQk4RTv/9780141035796.jpg