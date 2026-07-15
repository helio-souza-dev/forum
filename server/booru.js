const Booru = require('@himeka/booru');
const https = require('https');

const SITES_CONFIG = [
  { id: 'sb', name: 'Safebooru', desc: 'Arte geral segura', defaultTags: ['animated'], siteDomain: 'https://safebooru.org/' },
  { id: 'sakugabooru.com', name: 'Sakugabooru', desc: 'Clipes de animação', defaultTags: [], siteDomain: 'https://www.sakugabooru.com/' },
  { id: 'gb', name: 'Gelbooru', desc: 'Galeria geral de animes', defaultTags: ['animated'], siteDomain: 'https://gelbooru.com/' },
  { id: 'kn', name: 'Konachan', desc: 'Wallpapers em alta resolução', defaultTags: [], siteDomain: 'https://konachan.net/' },
  { id: 'yd', name: 'Yande.re', desc: 'Scans e ilustrações digitais', defaultTags: [], siteDomain: 'https://yande.re/' }
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
          if (data.trim().startsWith('<') || data.includes('<!DOCTYPE')) {
            return reject(new Error('Bloqueio Anti-Bot Cloudflare (HTML recebido em vez de JSON)'));
          }
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

async function fetchGelbooruJson(tagsArray, pageNum, limitNum) {
  const pid = (pageNum - 1);
  const tagQuery = encodeURIComponent(tagsArray.join(' '));
  const url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`;

  const resJson = await fetchDirectJson(url);
  const posts = Array.isArray(resJson) ? resJson : (resJson.post || []);
  
  return posts.map(post => ({
    id: post.id || Math.random().toString(36).substring(2, 9),
    fileUrl: post.file_url || '',
    previewUrl: post.preview_url || post.sample_url || post.file_url || '',
    tags: (post.tags || '').split(/[ ,]+/).map(t => t.trim()).filter(Boolean),
    score: post.score || 0,
    rating: post.rating || 'q',
    source: post.source || '',
    owner: post.owner || post.creator_id || 'Gelbooru User',
    type: (post.file_url && (post.file_url.endsWith('.mp4') || post.file_url.endsWith('.webm'))) ? 'video' :
          (post.file_url && post.file_url.endsWith('.gif')) ? 'gif' : 'image'
  }));
}

async function fetchGelbooruHtml(tagsArray, pageNum, limitNum) {
  const pid = (pageNum - 1) * 42;
  const tagQuery = encodeURIComponent(tagsArray.join(' '));
  const url = `https://gelbooru.com/index.php?page=post&s=list&tags=${tagQuery}&pid=${pid}`;

  const html = await fetchDirectHtml(url);
  const articles = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || [];
  
  const posts = [];
  for (const art of articles.slice(0, limitNum)) {
    const idMatch = art.match(/id=["']?p(\d+)["']?/i) || art.match(/id=(\d+)/i);
    const id = idMatch ? idMatch[1] : Math.random().toString(36).substring(2, 9);
    
    const imgMatch = art.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (!imgMatch) continue;
    
    const thumbUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : `https:${imgMatch[1]}`;
    
    const titleMatch = art.match(/title=["']([^"']+)["']/i);
    const titleText = titleMatch ? titleMatch[1] : '';
    const tags = titleText.split(/[ ,]+/).map(t => t.trim()).filter(t => !t.startsWith('score:') && !t.startsWith('rating:'));
    
    const isWebm = art.includes('class="webm"') || art.includes("class='webm'") || tags.includes('video') || tags.includes('webm') || tags.includes('mp4');
    const isGif = !isWebm && (thumbUrl.toLowerCase().includes('.gif') || tags.includes('gif') || tags.includes('animated_gif') || tags.includes('animated'));
    
    let fileUrl = thumbUrl;
    if (thumbUrl.includes('/thumbnails/')) {
      const baseNameMatch = thumbUrl.match(/thumbnail_([^\.]+)\.([a-z0-9]+)$/i);
      if (baseNameMatch) {
        const hash = baseNameMatch[1];
        const ext = isWebm ? 'mp4' : isGif ? 'gif' : baseNameMatch[2];
        fileUrl = thumbUrl.replace('/thumbnails/', '/images/').replace(`thumbnail_${hash}.${baseNameMatch[2]}`, `${hash}.${ext}`);
      }
    }
    
    posts.push({
      id,
      fileUrl,
      previewUrl: thumbUrl,
      tags,
      score: 0,
      rating: 'q',
      source: `https://gelbooru.com/index.php?page=post&s=view&id=${id}`,
      owner: 'Gelbooru User',
      type: isWebm ? 'video' : isGif ? 'gif' : 'image'
    });
  }
  
  return posts;
}

async function fetchGelbooruPosts(tagsArray, pageNum, limitNum) {
  try {
    const posts = await fetchGelbooruJson(tagsArray, pageNum, limitNum);
    if (posts && posts.length > 0) return posts;
  } catch (err) {
    console.log('[Booru] API JSON de Gelbooru respondeu 401/erro, acionando scraper HTML de fallback...');
  }
  return await fetchGelbooruHtml(tagsArray, pageNum, limitNum);
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
    // Sem tag padrão para permitir que as APIs tragam o feed mais recente sem quebrar na query "all"
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
        rawPosts = await fetchGelbooruPosts(tagsArray, pageNum, limitNum);
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
      console.error(`[Booru] Erro no fallback secundário de "${site}":`, fallbackErr.message);
    }
  }

  // FALLBACK DE ALTA DISPONIBILIDADE UNIVERSAL
  // Se o booru original foi bloqueado pelo Cloudflare (0 posts retornados), usamos a ponte anti-bot do xbooru e safebooru
  if (!rawPosts || rawPosts.length === 0) {
    try {
      console.log(`[Booru Engine] Ativando ponte resiliente anti-bot de alta disponibilidade para "${site}"...`);
      const pid = (pageNum - 1);
      const cleanFallbackTags = tagsArray.filter(t => t !== 'all' && t !== 'animated');
      const tagQuery = encodeURIComponent(cleanFallbackTags.join(' '));
      const isExplicitQuery = site === 'gb' || site === 'kn' || site === 'yd' || tagsArray.some(t => ['futa', 'nude', 'nsfw', 'explicit', 'ecchi', 'hentai', 'boobs', 'ass'].includes(t));
      
      const fallbackUrls = isExplicitQuery
        ? [
            `https://xbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`,
            `https://tbib.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`,
            `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`
          ]
        : [`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${tagQuery}&limit=${limitNum}&pid=${pid}`];
      
      for (const fUrl of fallbackUrls) {
        try {
          const resJson = await fetchDirectJson(fUrl);
          const candidate = Array.isArray(resJson) ? resJson : (resJson && resJson.post ? resJson.post : []);
          if (candidate && candidate.length > 0) {
            rawPosts = candidate;
            break;
          }
        } catch (subErr) {
          console.warn(`[Booru SubFallback] Falha em ${fUrl}:`, subErr.message);
        }
      }
    } catch (resilientErr) {
      console.error(`[Booru] Falha na ponte de alta disponibilidade:`, resilientErr.message);
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
    } else if (cleanUrlLower.endsWith('.gif') || postTags.includes('gif') || postTags.includes('animated_gif')) {
      postType = 'gif';
    } else if (postTags.includes('video') || postTags.includes('mp4') || postTags.includes('webm') || site === 'sakugabooru.com') {
      postType = 'video';
    } else if (cleanUrlLower.endsWith('.jpg') || cleanUrlLower.endsWith('.png') || cleanUrlLower.endsWith('.jpeg') || cleanUrlLower.endsWith('.webp')) {
      postType = 'image';
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

    // Extração da Fonte original (X / Twitter / Pixiv) se disponível
    const sourceUrl = post.source || (post.data && (post.data.source || post.data.source_url)) || '';

    // Extração inteligente de Autor / Artista sem cair em bots de espelhamento (ex: "danbooru", "gelbooru")
    let authorName = '';
    if (post.data && post.data.tag_string_artist) {
      authorName = post.data.tag_string_artist.split(/[ ,]+/)[0];
    } else if (post.artist) {
      authorName = Array.isArray(post.artist) ? post.artist[0] : String(post.artist);
    }
    if (!authorName && sourceUrl) {
      const twMatch = sourceUrl.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i);
      if (twMatch && twMatch[1] !== 'i' && twMatch[1] !== 'search' && twMatch[1] !== 'home') {
        authorName = twMatch[1];
      }
    }
    if (!authorName) {
      const artistTag = postTags.find(t => t.endsWith('_(artist)') || t.startsWith('artist:'));
      if (artistTag) {
        authorName = artistTag.replace(/_\(artist\)$/, '').replace(/^artist:/, '');
      }
    }
    if (!authorName) {
      const rawAuthor = post.author || post.uploader || post.owner || (post.data && (post.data.author || post.data.uploader_name || post.data.owner || post.data.creator || post.data.user));
      const ignoredNames = ['danbooru', 'gelbooru', 'safebooru', 'konachan', 'yande.re', 'e621', 'anonymous', 'system', 'admin', 'rule34', 'bot'];
      if (rawAuthor && typeof rawAuthor === 'string' && !ignoredNames.includes(rawAuthor.toLowerCase().trim())) {
        authorName = rawAuthor;
      }
    }
    if (!authorName) {
      const maybeArtist = postTags.find(t => t.includes('(') && !t.includes('(series)') && !t.includes('(character)') && !t.includes('(cosplay)') && !t.includes('the_'));
      if (maybeArtist) authorName = maybeArtist;
    }
    if (!authorName) authorName = `${siteConfig.name.split(' ')[0]}_Uploader`;

    // Extração do Título ou identificação
    const rawTitle = post.title || (post.data && (post.data.title || post.data.subject)) || '';
    const cleanTitle = rawTitle && typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : `${siteConfig.name.split(' ')[0]} #${postId}`;

    normalizedPosts.push({
      id: `booru-${site}-${postId}`,
      title: cleanTitle,
      author: authorName,
      uploader: authorName,
      source: sourceUrl,
      description: `[ARTISTA / AUTOR: @${authorName}] | Score: ${score} | Rating: ${String(rating).toUpperCase()} | Origem: ${siteConfig.name}.`,
      filename: fileUrl.split('/').pop() || `booru_${postId}`,
      url: hotlinkUrl,
      previewUrl: hotlinkPreview,
      rawUrl: fileUrl,
      type: postType,
      tags: postTags.slice(0, 15),
      nsfw: !siteDomain.toLowerCase().includes('safebooru'),
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
        const match = item.match(/^([^\s()]+)\s*\(([0-9,]+)\)/);
        if (match) {
          suggestions.push({ name: match[1], count: Number(match[2].replace(/,/g, '')) || 0 });
        } else {
          suggestions.push({ name: item, count: 0 });
        }
      } else if (item && typeof item === 'object') {
        let extCount = Number(item.count || item.post_count || item.total) || 0;
        if (!extCount && typeof item.label === 'string') {
          const match = item.label.match(/\(([0-9,]+)\)/);
          if (match) extCount = Number(match[1].replace(/,/g, '')) || 0;
        }
        const nameClean = item.value || item.name || (typeof item.label === 'string' ? item.label.split(' ')[0] : '');
        if (nameClean) {
          suggestions.push({ name: nameClean, count: extCount });
        }
      }
    }

    return suggestions.slice(0, limitNum);
  } catch (err) {
    try {
      if (site !== 'sb') {
        const fallbackRes = await fetchDirectJson(`https://safebooru.org/autocomplete.php?q=${cleanQ}`);
        if (Array.isArray(fallbackRes)) {
          return fallbackRes.slice(0, limitNum).map(item => {
            if (typeof item === 'string') {
              const match = item.match(/^([^\s()]+)\s*\(([0-9,]+)\)/);
              return match ? { name: match[1], count: Number(match[2].replace(/,/g, '')) || 0 } : { name: item, count: 0 };
            }
            return { name: item.value || item.name || '', count: Number(item.count || 0) };
          }).filter(s => Boolean(s.name));
        }
      }
    } catch (fallbackTagErr) {
      // Ignora erro final de tag
    }
    console.error(`[Booru AutoComplete] Erro ao buscar sugestões para "${site}" e query "${query}":`, err.message);
    return [];
  }
}

module.exports = {
  getAvailableSites,
  searchBoorus,
  fetchBooruTagSuggestions
};
