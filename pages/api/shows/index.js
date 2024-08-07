import Show from '../../../models/show-model'
import { connectDb } from '@/helpers/db-util';
import xss from 'xss';

function isValidShow(show) {
  const { title, date, genre, location, time, price, image } = show;
  return title && date && genre && location && price && image && time;
}

function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.min(jan, jul) != date.getTimezoneOffset();
}

function preSaveLogic(show) {
  if (show.date) {
    const dateUTC = new Date(show.date);
    dateUTC.setDate(dateUTC.getDate() + 1);
    const offset = isDST(dateUTC) ? 7 : 8;
    dateUTC.setUTCHours(offset, 0, 0, 0);
    show.expiresAt = dateUTC;
  }
  return show;
}

export async function handlePostRequest(req, res) {
  const data = req.body;

  if (Array.isArray(data)) {
    const allValid = data.every(isValidShow);
    if (!allValid) {
      res.status(422).json({ message: 'Invalid info in one or more shows' });
      return;
    }
    
    let insertableShows = [];
    for (let show of data) {
      show.excerpt = xss(show.excerpt);
      const existingShow = await Show.findOne({ title: show.title, date: show.date });
      if (!existingShow) {
        preSaveLogic(show)
        insertableShows.push(show);
      } else {
        console.log(`Skipping duplicate show: ${show.title} on ${show.date}`);
      }
    }

    if (insertableShows.length > 0) {
      try {
        const newShows = await Show.insertMany(insertableShows);
        res.status(201).json({ message: 'New Shows Added', shows: newShows });
      } catch (error) {
        res.status(500).json({ message: 'Inserting shows failed', error: error.message });
      }
    } else {
      res.status(409).json({ message: 'No new shows to add, duplicates skipped' });
    }
  } else {
    if (!isValidShow(data)) {
      res.status(422).json({ message: 'Invalid show data' });
      return;
    }
    data.excerpt = xss(data.excerpt);
    const existingShow = await Show.findOne({ title: data.title, date: data.date });
    if (!existingShow) {
      try {
        const newShow = new Show(data);
        await newShow.save();
        res.status(201).json({ message: 'New Show Added', show: newShow });
      } catch (error) {
        res.status(500).json({ message: 'Inserting the show failed', error: error.message });
      }
    } else {
      res.status(409).json({ message: 'Show with the same title and date already exists' });
    }
  }
}

export async function handleGetRequest(req, res) {
  const { year, month, page = 1, limit = 15 } = req.query;

  try {
    await connectDb();
    const numYear = parseInt(year, 10);
    const numMonth = parseInt(month, 10);

    if (isNaN(numYear) || isNaN(numMonth) || numYear > 2030 || numYear < 2021 || numMonth < 1 || numMonth > 12) {
      res.status(400).json({ message: 'Invalid year or month' });
      return;
    }

    const skip = (page - 1) * limit;

    const startDate = new Date(numYear, numMonth - 1, 1);
    const endDate = new Date(numYear, numMonth, 0, 23, 59, 59);

    const totalShows = await Show.countDocuments({
      date: { $gte: startDate, $lte: endDate }
    });

    const shows = await Show.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).skip(skip).limit(Number(limit));

    res.status(200).json({ shows, totalShows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shows', error: error.message });
  }
}

async function handler(req, res) {
  try {
    await connectDb();
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ message: 'Error connecting to database', error: error.message });
    return;
  }

  if (req.method === 'POST') {
    await handlePostRequest(req, res);
  } else if (req.method === 'GET') {
    await handleGetRequest(req, res);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default handler;
