const Booru = require('@himeka/booru');
const https = require('https');

const SITES_CONFIG = [
  { id: 'sb', name: 'Safebooru (Safe)', desc: 'Arte segura de anime e games com vídeos e ilustrações', defaultTags: ['animated'], siteDomain: 'https://safebooru.org/' },
  { id: 'sakugabooru.com', name: 'Sakugabooru (Vídeos & Animações)', desc: 'Clipes em vídeo .mp4/.webm de animação 2D e 3D', defaultTags: [], siteDomain: 'https://www.sakugabooru.com/' },
  { id: 'gb', name: 'Gelbooru (Animes & Vídeos)', desc: 'Enorme galeria geral de animes, arts, gifs e vídeos curtos', defaultTags: ['animated'], siteDomain: 'https://gelbooru.com/' },
  { id: 'kn', name: 'Konachan.net (High-Res)', desc: 'Wallpapers e artes de altíssima resolução', defaultTags: [], siteDomain: 'https://konachan.net/' },
  { id: 'yd', name: 'Yande.re (Scans)', desc: 'Artes escaneadas e ilustrações digitais', defaultTags: [], siteDomain: 'https://yande.re/' }
];

function getAvailableSites() {
  return SITES_CONFIG;
}

function fetchDirectJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function fetchDirectHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeGelbooruHtml(tagsArray, pageNum, limitNum) {
  const pid = (pageNum - 1) * 42;
  const tagQuery = encodeURIComponent(tagsArray.join(' '));
  const url = `https://gelbooru.com/index.php?page=post&s=list&tags=${tagQuery}&pid=${pid}`;

  const html = await fetchDirectHtml(url);
  const articles = [...html.matchAll(/<article[^>]*class="thumbnail-preview"[^>]*>([\s\S]*?)<\/article>/gi)];
  
  const results = [];
  for (const articleMatch of articles) {
    if (results.length >= limitNum) break;
    const articleHtml = articleMatch[1];
    const idMatch = articleHtml.match(/id="p(\d+)"/i) || articleHtml.match(/id=\d+/i);
    const imgMatch = articleHtml.match(/<img[^>]+src="([^"]+)"[^>]+title="([^"]*)"/i);
    
    if (idMatch && imgMatch) {
      const postId = idMatch[1];
      const thumbUrl = imgMatch[1];
      const tagsStr = imgMatch[2];
      const postTags = tagsStr.split(/[ ,]+/).map(t => t.trim()).filter(Boolean);

      // Extract full media URL from thumbnail url pattern:
      // e.g. https://img4.gelbooru.com/thumbnails/f9/c6/thumbnail_f9c65ab2532582a21c65c4f9814f256b.jpg
      // -> https://img4.gelbooru.com/images/f9/c6/f9c65ab2532582a21c65c4f9814f256b.[ext]
      const thumbClean = thumbUrl.replace('/thumbnails/', '/images/').replace('/thumbnail_', '/');
      let fullMediaUrl = thumbClean;
      let postType = 'image';

      if (postTags.includes('video') || postTags.includes('mp4') || postTags.includes('webm')) {
        fullMediaUrl = thumbClean.replace(/\.(jpg|png|jpeg|webp)$/i, '.mp4');
        postType = 'video';
      } else if (postTags.includes('gif') || postTags.includes('animated_gif')) {
        fullMediaUrl = thumbClean.replace(/\.(jpg|png|jpeg|webp)$/i, '.gif');
        postType = 'gif';
      } else if (postTags.includes('png')) {
        fullMediaUrl = thumbClean.replace(/\.(jpg|png|jpeg|webp)$/i, '.png');
        postType = 'image';
      } else if (postTags.includes('webp')) {
        fullMediaUrl = thumbClean.replace(/\.(jpg|png|jpeg|webp)$/i, '.webp');
        postType = 'image';
      } else {
        postType = 'image';
      }

      results.push({
        id: postId,
        fileUrl: fullMediaUrl,
        previewUrl: thumbUrl,
        tags: postTags,
        score: 0,
        rating: 'q',
        type: postType
      });
    }
  }

  return results;
}

async function searchBoorus({ site = 'sb', tags = '', limit = 36, type = 'all', page = 1 }) {
  const siteConfig = SITES_CONFIG.find(s => s.id === site || s.name.toLowerCase().includes(site)) || SITES_CONFIG[0];
  const siteDomain = siteConfig.siteDomain;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 36, 12), 60);

  let tagsArray = [];
  if (tags && typeof tags === 'string') {
    tagsArray = tags.split(/[ ,]+/).map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
  } else if (Array.isArray(tags)) {
    tagsArray = tags.map(t => String(t).trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
  }

  if (type === 'video' && site !== 'sakugabooru.com' && site !== 'kn' && site !== 'yd') {
    if (!tagsArray.includes('animated') && !tagsArray.includes('video') && !tagsArray.includes('gif') && !tagsArray.includes('mp4') && !tagsArray.includes('webm')) {
      if (siteConfig.defaultTags && siteConfig.defaultTags.length > 0) {
        tagsArray.push(...siteConfig.defaultTags);
      } else {
        tagsArray.push('animated');
      }
    }
  } else if (tagsArray.length === 0 && site === 'gb') {
    tagsArray.push('all');
  }

  let rawPosts = [];

  try {
    if (site === 'sakugabooru.com' || site === 'gb') {
      throw new Error(`Fallback direto para ${site}`);
    }
    const booruPosts = await Booru.search(site, tagsArray, { limit: limitNum, page: pageNum, random: false });
    rawPosts = booruPosts;
  } catch (booruErr) {
    try {
      if (site === 'gb') {
        rawPosts = await scrapeGelbooruHtml(tagsArray, pageNum, limitNum);
      } else {
        const tagQuery = encodeURIComponent(tagsArray.join(' '));
        let apiUrl = '';
        if (site === 'sakugabooru.com') {
          apiUrl = `https://www.sakugabooru.com/post.json?tags=${tagQuery}&limit=${limitNum}&page=${pageNum}`;
        } else if (site === 'kn') {
          apiUrl = `https://konachan.net/post.json?tags=${tagQuery}&limit=${limitNum}&page=${pageNum}`;
        } else if (site === 'sb') {
          const pid = (pageNum - 1);
          apiUrl = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`;
        } else if (site === 'yd') {
          apiUrl = `https://yande.re/post.json?tags=${tagQuery}&limit=${limitNum}&page=${pageNum}`;
        } else {
          throw new Error('Nenhum fallback para ' + site);
        }

        const resJson = await fetchDirectJson(apiUrl);
        rawPosts = Array.isArray(resJson) ? resJson : (resJson.post || []);
      }
    } catch (fallbackErr) {
      console.error(`[Booru] Erro final ao buscar posts de "${site}":`, fallbackErr.message);
      return [];
    }
  }

  const normalizedPosts = [];

  for (const post of rawPosts) {
    const fileUrlRaw = post.fileUrl || post.file_url || (post.data && post.data.file_url);
    if (!fileUrlRaw || typeof fileUrlRaw !== 'string') continue;

    const fileUrl = fileUrlRaw.startsWith('http') ? fileUrlRaw : `https:${fileUrlRaw}`;
    const previewRaw = post.previewUrl || post.preview_url || post.sampleUrl || post.sample_url || fileUrl;
    const previewUrl = (typeof previewRaw === 'string') ? (previewRaw.startsWith('http') ? previewRaw : `https:${previewRaw}`) : fileUrl;

    let postTags = [];
    if (Array.isArray(post.tags)) {
      postTags = post.tags.map(t => String(t || '').trim()).filter(Boolean);
    } else if (typeof post.tags === 'string') {
      postTags = post.tags.split(/[ ,]+/).map(t => t.trim()).filter(Boolean);
    } else if (post.data && typeof post.data.tags === 'string') {
      postTags = post.data.tags.split(/[ ,]+/).map(t => t.trim()).filter(Boolean);
    }

    const cleanUrlLower = fileUrl.toLowerCase().split('?')[0];
    let postType = post.type || 'image';

    if (cleanUrlLower.endsWith('.mp4') || cleanUrlLower.endsWith('.webm') || cleanUrlLower.endsWith('.mov')) {
      postType = 'video';
    } else if (cleanUrlLower.endsWith('.gif')) {
      postType = 'gif';
    } else if (cleanUrlLower.endsWith('.jpg') || cleanUrlLower.endsWith('.png') || cleanUrlLower.endsWith('.jpeg') || cleanUrlLower.endsWith('.webp')) {
      postType = 'image';
    } else if (postTags.includes('video') || postTags.includes('mp4') || postTags.includes('webm') || site === 'sakugabooru.com') {
      postType = 'video';
    }

    if (type && type !== 'all') {
      if (type === 'video' && postType !== 'video' && postType !== 'gif') continue;
      if (type === 'image' && postType !== 'image') continue;
      if (type === 'gif' && postType !== 'gif') continue;
    }

    const postId = post.id || (post.data && post.data.id) || Math.random().toString(36).substring(2, 9);
    const score = post.score || (post.data && post.data.score) || 0;
    const rating = post.rating || (post.data && post.data.rating) || 's';

    const hotlinkUrl = `/api/hotlink?url=${encodeURIComponent(fileUrl)}&referer=${encodeURIComponent(siteDomain)}`;
    const hotlinkPreview = `/api/hotlink?url=${encodeURIComponent(previewUrl)}&referer=${encodeURIComponent(siteDomain)}`;

    normalizedPosts.push({
      id: `booru-${site}-${postId}`,
      title: `${siteConfig.name.split(' ')[0]} #${postId}`,
      description: `[ORIGEM EXTERNA: ${siteConfig.name}] | Score: ${score} | Rating: ${String(rating).toUpperCase()} | URL Original Hotlinkada pelo PrismShare.`,
      filename: fileUrl.split('/').pop() || `booru_${postId}`,
      url: hotlinkUrl,
      previewUrl: hotlinkPreview,
      rawUrl: fileUrl,
      type: postType,
      tags: postTags.slice(0, 15),
      likes: 0,
      likedBy: [],
      views: 0,
      external: true,
      siteName: siteConfig.name,
      siteDomain: siteDomain,
      createdAt: new Date().toISOString()
    });
  }

  return normalizedPosts;
}

async function fetchBooruTagSuggestions({ site = 'sb', query = '', limit = 12 }) {
  if (!query || !query.trim()) return [];
  const cleanQ = encodeURIComponent(query.trim().toLowerCase());
  const limitNum = Math.min(Number(limit) || 12, 25);

  try {
    let apiUrl = '';
    if (site === 'sakugabooru.com' || site === 'kn' || site === 'yd') {
      const host = site === 'sakugabooru.com' ? 'www.sakugabooru.com' : (site === 'kn' ? 'konachan.net' : 'yande.re');
      apiUrl = `https://${host}/tag.json?limit=${limitNum}&order=count&name=*${cleanQ}*`;
    } else if (site === 'sb') {
      apiUrl = `https://safebooru.org/autocomplete.php?q=${cleanQ}`;
    } else if (site === 'gb') {
      apiUrl = `https://gelbooru.com/index.php?page=autocomplete2&term=${cleanQ}&type=tag_query&limit=${limitNum}`;
    } else {
      return [];
    }

    const resJson = await fetchDirectJson(apiUrl);
    if (!Array.isArray(resJson) && !(resJson && Array.isArray(resJson.tag))) {
      return [];
    }

    const rawList = Array.isArray(resJson) ? resJson : resJson.tag;
    const suggestions = [];

    for (const item of rawList) {
      if (typeof item === 'string') {
        suggestions.push({ name: item, count: 0 });
      } else if (item && item.name) {
        suggestions.push({ name: item.name, count: Number(item.count || item.post_count) || 0 });
      } else if (item && item.label) {
        const nameClean = item.value || item.label.split(' ')[0];
        suggestions.push({ name: nameClean, count: 0 });
      }
    }

    return suggestions.slice(0, limitNum);
  } catch (err) {
    console.error(`[Booru AutoComplete] Erro ao buscar sugestões para "${site}" e query "${query}":`, err.message);
    return [];
  }
}

module.exports = {
  getAvailableSites,
  searchBoorus,
  fetchBooruTagSuggestions
};
