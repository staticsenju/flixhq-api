# FlixHQ API

A specialized Node.js library that provides an API for obtaining movie and TV show information, including metadata, seasons, episodes, and streaming sources from FlixHQ.

[![npm version](https://img.shields.io/npm/v/flixhq-api.svg)](https://www.npmjs.com/package/flixhq-api)
![NPM Downloads](https://img.shields.io/npm/dt/flixhq-api)

## Features

- **Home Data**: Fetch trending movies, TV shows, and latest releases.
- **Search**: Advanced search functionality for movies and series.
- **Filters**: Filter content by type (Movie/TV), Genre, Country, and Top IMDB.
- **Details**: Scrape full metadata including plot, year, country, and cast.
- **Episodes**: Retrieve full season and episode lists for TV series.
- **Streaming**: Extract server lists and streaming sources (HLS/m3u8).

## Installation

```bash
npm i flixhq-api

```

## Quick Start

```javascript
const FlixHQ = require('flixhq-api');

const flixhq = new FlixHQ();

(async () => {
  const data = await flixhq.search("The Last of Us");
  console.log(data);
})();

```

## API Methods

### Content Discovery

#### `fetchHome()`

Fetches data from the homepage, including Trending Movies, Trending TV, Latest Movies, and Latest TV.

```javascript
const home = await flixhq.fetchHome();
console.log(home.trendingMovies);

```

#### `fetchMovies(page)`

Fetches a list of movies.

* `page` (number, optional): Default is 1.

```javascript
const movies = await flixhq.fetchMovies(1);

```

#### `fetchTVShows(page)`

Fetches a list of TV shows.

* `page` (number, optional): Default is 1.

```javascript
const tvShows = await flixhq.fetchTVShows(1);

```

#### `fetchTopIMDB(type, page)`

Fetches content sorted by IMDB rating.

* `type` (string, optional): 'all', 'movie', or 'tv'. Default 'all'.
* `page` (number, optional): Default is 1.

```javascript
const topRated = await flixhq.fetchTopIMDB('movie', 1);

```

### Search & Filters

#### `search(query)`

Search for movies or TV shows by title.

```javascript
const results = await flixhq.search("Breaking Bad");
// Returns: [{ id: 'breaking-bad-12345', title: 'Breaking Bad', ... }]

```

#### `fetchGenres()` & `fetchCountries()`

Returns a list of available genres and countries for filtering.

```javascript
const genres = await flixhq.fetchGenres();
const countries = await flixhq.fetchCountries();

```

#### `filter(type, value, page)`

Filter content by specific criteria.

* `type`: The filter category (e.g., 'genre', 'country').
* `value`: The specific slug (e.g., 'action', 'us').

```javascript
const actionMovies = await flixhq.filter('genre', 'action', 1);

```

### Metadata & Media Info

#### `getDetails(slug)`

Get detailed information about a specific media item.

* `slug`: The unique string ID (e.g., `movie/watch-avatar-12345`).

```javascript
const info = await flixhq.getDetails("movie/watch-avatar-12345");
/* Returns:
{
  id: "12345",
  title: "Avatar",
  description: "...",
  year: 2009,
  released: "2009-12-18",
  genres: ["Action", "Sci-Fi"]
}
*/

```

#### `getSeasons(slug)`

Get available seasons for a TV show.

```javascript
const seasons = await flixhq.getSeasons("tv/watch-stranger-things-39444");

```

#### `getEpisodes(seasonId)`

Get all episodes for a specific season ID.

```javascript
const episodes = await flixhq.getEpisodes("12345"); // seasonId returned from getSeasons

```

### Streaming

#### `getServers(contentId, type)`

Get available streaming servers for a movie or episode.

* `contentId`: The ID of the movie or the specific episode ID.
* `type`: 'movie' or 'tv'.

```javascript
// For a movie
const servers = await flixhq.getServers("12345", "movie"); // id of movie

// For an episode
const servers = await flixhq.getServers("67890", "tv"); //id of episode returned from getEpisodes(seasonId)

```

#### `fetchSource(serverId)`

Extracts the streaming link (m3u8) for a specific server ID.

```javascript
const source = await flixhq.fetchSource("54321"); / sourceID of getServers(contentId, type)
/* Returns:
{
  source: "https://.../master.m3u8",
  type: "hls",
  encrypted: false
}
*/

```

## Dependencies

* **Axios**: For HTTP requests.
* **Cheerio**: For DOM parsing and scraping.

## Disclaimer

This library is for educational purposes only. The authors do not endorse or promote copyright infringement. Users are responsible for ensuring they comply with local laws and terms of service of the target websites.

```

```
