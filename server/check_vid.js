const https = require('https');

https.get('https://gelbooru.com/index.php?page=post&s=view&id=14462826', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const vid = data.match(/<source[^>]+src="([^"]+)"/i);
    const orig = data.match(/<li><a href="([^"]+)"[^>]*>Original/i) || data.match(/<li><a[^>]+href="([^"]+)"[^>]*>Original/i);
    console.log('Vid match:', vid ? vid[1] : 'none');
    console.log('Orig match:', orig ? orig[1] : 'none');
    // Also log any .mp4 or .webm urls found inside the HTML
    const mp4s = data.match(/https?:\/\/[^"'\s]+\.mp4/gi);
    console.log('MP4s found:', mp4s);
  });
});
