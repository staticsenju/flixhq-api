const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class FlixHQ {
  constructor() {
    this.baseUrl = 'https://flixhq.to';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  _parseGrid($) {
    const items = [];
    $('.flw-item').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('.film-name a');
      const title = $link.text().trim();
      const href = $link.attr('href') || '';
      const slug = href.replace(/^\//, ''); 
      const poster = $el.find('img').attr('data-src') || $el.find('img').attr('src');
      
      const yearRaw = $el.find('.fdi-item').first().text().trim();
      const year = parseInt(yearRaw) || null;
      
      const duration = $el.find('.fdi-duration').text().trim() || $el.find('.fdi-item').eq(2).text().trim();
      const quality = $el.find('.film-poster-quality').text().trim();
      
      let type = 'movie';
      if (href.includes('/tv/') || $el.find('.fdi-type').text().trim() === 'TV') {
        type = 'tv';
      }

      if (title && slug) {
        items.push({ 
          id: slug.split('-').pop(), 
          title, slug, poster, year, duration, quality, type 
        });
      }
    });
    return items;
  }

  async fetchHome() {
    try {
      const { data } = await axios.get(`${this.baseUrl}/home`, { headers: this.headers });
      const $ = cheerio.load(data);
      const trendingMovies = [];
      $('#trending-movies .flw-item').each((_, el) => trendingMovies.push(this._parseSingleItem($(el), 'movie')));
      const trendingTV = [];
      $('#trending-tv .flw-item').each((_, el) => trendingTV.push(this._parseSingleItem($(el), 'tv')));
      const latestMovies = [];
      const latestTV = [];
      $('.block_area').each((_, block) => {
        const heading = $(block).find('.cat-heading').text().trim();
        if (heading === 'Latest Movies') $(block).find('.flw-item').each((_, el) => latestMovies.push(this._parseSingleItem($(el), 'movie')));
        else if (heading === 'Latest TV Shows') $(block).find('.flw-item').each((_, el) => latestTV.push(this._parseSingleItem($(el), 'tv')));
      });
      return { trendingMovies, trendingTV, latestMovies, latestTV };
    } catch (e) { return {}; }
  }

  _parseSingleItem($el, forcedType) {
    const title = $el.find('.film-name a').text().trim();
    const href = $el.find('.film-name a').attr('href') || '';
    const slug = href.replace(/^\//, '');
    const poster = $el.find('img').attr('data-src') || $el.find('img').attr('src');
    const quality = $el.find('.film-poster-quality').text().trim();
    const year = parseInt($el.find('.fdi-item').first().text().trim()) || null;
    return {
      id: slug.split('-').pop(),
      title, slug, poster, year, quality,
      type: forcedType || (href.includes('/tv/') ? 'tv' : 'movie')
    };
  }

  async fetchMovies(page = 1) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/movie?page=${page}`, { headers: this.headers });
      return this._parseGrid(cheerio.load(data));
    } catch (e) { return []; }
  }

  async fetchTVShows(page = 1) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/tv-show?page=${page}`, { headers: this.headers });
      return this._parseGrid(cheerio.load(data));
    } catch (e) { return []; }
  }

  async fetchTopIMDB(type = 'all', page = 1) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/top-imdb?type=${type}&page=${page}`, { headers: this.headers });
      return this._parseGrid(cheerio.load(data));
    } catch (e) { return []; }
  }

async fetchFilters() {
    const countryMap = {
      "AR": "Argentina", "AU": "Australia", "AT": "Austria", "BE": "Belgium",
      "BR": "Brazil", "CA": "Canada", "CN": "China", "CZ": "Czech Republic",
      "DK": "Denmark", "FI": "Finland", "FR": "France", "DE": "Germany",
      "HK": "Hong Kong", "HU": "Hungary", "IN": "India", "IE": "Ireland",
      "IL": "Israel", "IT": "Italy", "JP": "Japan", "LU": "Luxembourg",
      "MX": "Mexico", "NL": "Netherlands", "NZ": "New Zealand", "NO": "Norway",
      "PL": "Poland", "RO": "Romania", "RU": "Russia", "ZA": "South Africa",
      "KR": "South Korea", "ES": "Spain", "SE": "Sweden", "CH": "Switzerland",
      "TW": "Taiwan", "TH": "Thailand", "GB": "United Kingdom", "US": "United States"
    };

    try {
      const [genreRes, countryRes] = await Promise.allSettled([
        axios.get(`${this.baseUrl}/sitemap-genre.xml`, { headers: this.headers }),
        axios.get(`${this.baseUrl}/sitemap-country.xml`, { headers: this.headers })
      ]);

      const genres = [];
      if (genreRes.status === 'fulfilled') {
        const $ = cheerio.load(genreRes.value.data, { xmlMode: true });
        $('loc').each((_, el) => {
          const url = $(el).text().trim();
          const id = url.split('/').pop();
          const name = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (id) genres.push({ id, name });
        });
      }

      const countries = [];
      if (countryRes.status === 'fulfilled') {
        const $ = cheerio.load(countryRes.value.data, { xmlMode: true });
        $('loc').each((_, el) => {
          const url = $(el).text().trim();
          const id = url.split('/').pop();
          const name = countryMap[id] || id;
          if (id) countries.push({ id, name });
        });
      }

      return {
        genres,
        countries,
        years: ["2026", "2025", "2024", "2023", "2022", "older-2022"],
        qualities: ['HD', 'SD', 'CAM']
      };

    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async fetchGenres() { const f = await this.fetchFilters(); return f.genres || []; }
  async fetchCountries() { const f = await this.fetchFilters(); return f.countries || []; }

  async filter(type, value, page = 1) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/${type}/${value}?page=${page}`, { headers: this.headers });
      return this._parseGrid(cheerio.load(data));
    } catch (e) { return []; }
  }

  async search(query) {
    try {
      const formatted = query.trim().replace(/[\s\W]+/g, '-');
      const { data } = await axios.get(`${this.baseUrl}/search/${formatted}`, { headers: this.headers });
      return this._parseGrid(cheerio.load(data));
    } catch (error) { return []; }
  }

  async getDetails(slug) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/${slug}`, { headers: this.headers });
      const $ = cheerio.load(data);
      const getRow = (label) => $('.row-line').filter((_, e) => $(e).find('.type').text().trim() === label).text().replace(label, '').trim();
      const released = getRow('Released:');
      return {
        id: slug.split('-').pop(),
        title: $('.heading-name a').text().trim(),
        year: released ? parseInt(released.substring(0, 4)) : null,
        description: $('.description').text().trim() || '',
        country: getRow('Country:'),
        released,
        genres: $('.row-line').filter((_, e) => $(e).find('.type').text().includes('Genre')).find('a').map((_, el) => $(el).text().trim()).get(),
        poster: $('.film-poster img').attr('src')
      };
    } catch (error) { return null; }
  }

  async getSeasons(slug) {
    try {
      const id = slug.split('-').pop(); 
      const { data } = await axios.get(`${this.baseUrl}/ajax/season/list/${id}`, { headers: this.headers });
      const $ = cheerio.load(data);
      return $('.dropdown-item.ss-item').map((_, el) => ({
        season_number: parseInt($(el).text().replace('Season ', ''), 10) || 0,
        season_id: $(el).attr('data-id'),
        name: $(el).text().trim()
      })).get();
    } catch (error) { return []; }
  }

  async getEpisodes(seasonId) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/ajax/season/episodes/${seasonId}`, { headers: this.headers });
      const $ = cheerio.load(data);
      return $('.nav-item .eps-item').map((_, el) => {
        const titleRaw = $(el).attr('title');
        let number = 0, title = titleRaw;
        if (titleRaw) {
          const parts = titleRaw.split(':');
          if (parts.length >= 2) {
            number = parseInt(parts[0].replace('Eps', '').trim(), 10) || 0;
            title = parts.slice(1).join(':').trim();
          }
        }
        return { id: $(el).attr('data-id'), number, title };
      }).get();
    } catch (error) { return []; }
  }
  
  async getServers(contentId, type = 'tv') {
    try {
      const url = type === 'movie' ? `${this.baseUrl}/ajax/episode/list/${contentId}` : `${this.baseUrl}/ajax/episode/servers/${contentId}`;
      const { data } = await axios.get(url, { headers: this.headers });
      const $ = cheerio.load(data);
      const servers = [];
      $('.nav-item a').each((_, el) => {
        const $el = $(el);
        const id = $el.attr('data-id') || $el.attr('data-linkid');
        const name = $el.attr('title') || $el.find('span').text().trim();
        if (id) servers.push({ server_id: id, name: name.replace('Server ', '') });
      });
      return servers;
    } catch (error) { return []; }
  }

  async extractFromEmbed(embedUrl) {
    try {
      const parsed = new URL(embedUrl);
      const embedHost = `${parsed.protocol}//${parsed.host}`;
      
      const { data: html } = await axios.get(embedUrl, { 
        headers: { 'Referer': this.baseUrl, 'User-Agent': this.headers['User-Agent'] } 
      });

      let nonceMatch = html.match(/\b[a-zA-Z0-9]{48}\b/) ||
                       html.match(/\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b.*?\b([a-zA-Z0-9]{16})\b/);

      if (!nonceMatch) throw new Error("Encryption key not found in embed.");
      const nonce = nonceMatch.length === 4 ? nonceMatch.slice(1).join("") : nonceMatch[0];

      const fileId = embedUrl.substring(embedUrl.lastIndexOf("/") + 1).split("?")[0];
      const apiUrl = `${embedHost}/embed-1/v3/e-1/getSources?id=${fileId}&_k=${nonce}`;
      
      const { data: apiRes } = await axios.get(apiUrl, { 
        headers: { 
          'Referer': embedHost + '/', 
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': this.headers['User-Agent']
        } 
      });

      if (!apiRes.sources || !apiRes.sources.length) throw new Error("No sources returned from provider.");

      return {
        source: apiRes.sources[0].file,
        type: apiRes.sources[0].type || 'hls',
        tracks: apiRes.tracks || [],
        encrypted: apiRes.encrypted || false
      };

    } catch (error) {
      console.error(`[Extractor] Error: ${error.message}`);
      return null;
    }
  }

  async fetchSource(serverId) {
    try {
      const url = `${this.baseUrl}/ajax/episode/sources/${serverId}`;
      const { data } = await axios.get(url, { headers: this.headers });
      
      const link = data.link; 
      if (!link) throw new Error("No embed link found for this server.");

      return await this.extractFromEmbed(link);

    } catch (error) {
      console.error(`[FlixHQ] Source Fetch Error: ${error.message}`);
      return null;
    }
  }
}

module.exports = FlixHQ;
