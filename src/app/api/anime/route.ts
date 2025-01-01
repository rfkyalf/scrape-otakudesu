import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // Fetch HTML from the Anime List page
    const { data: html } = await axios.get(
      'https://otakudesu.cloud/anime-list/'
    );
    const $ = cheerio.load(html);

    // Temporary object to group anime titles by their starting letter
    const groupedAnimeList: Record<
      string,
      { title: string; url?: string; slug: string }[]
    > = {};

    // Select all anime links from the anime list section
    $('.daftarkartun .penzbar .jdlbar ul li a').each((_, element) => {
      const title = $(element).text().trim();
      const url = $(element).attr('href') || '';

      if (title && url) {
        const firstLetter = /^[A-Z]/i.test(title[0])
          ? title[0].toUpperCase()
          : '#';

        // Extract slug from URL
        const slugMatch = url.match(/\/([^/]+)\/?$/);
        const slug = slugMatch ? slugMatch[1] : '';

        // Ensure key exists for the first letter
        if (!groupedAnimeList[firstLetter]) {
          groupedAnimeList[firstLetter] = [];
        }

        // Add the anime to the corresponding group
        groupedAnimeList[firstLetter].push({ title, slug });
      }
    });

    // Transform grouped object into the desired array format
    const animes = Object.keys(groupedAnimeList)
      .sort() // Ensure alphabetical order
      .map((key) => ({
        label: key,
        data: groupedAnimeList[key],
      }));

    // Return the transformed data as JSON
    return NextResponse.json(
      { animes },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Error scraping Anime List:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anime list' },
      { status: 500 }
    );
  }
}