/* Use original region pixels even on portrait screens where cover scales by height. */
window.REGION_ART = {
 "1": {
  "src": "assets/regions/01-villas-v1.webp",
  "preview": "assets/regions/01-villas-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "2": {
  "src": "assets/regions/02-school-v1.webp",
  "preview": "assets/regions/02-school-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "3": {
  "src": "assets/regions/03-factory-v1.webp",
  "preview": "assets/regions/03-factory-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "4": {
  "src": "assets/regions/04-church-v1.webp",
  "preview": "assets/regions/04-church-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "5": {
  "src": "assets/regions/05-forest-v1.webp",
  "preview": "assets/regions/05-forest-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "6": {
  "src": "assets/regions/06-pond-v1.webp",
  "preview": "assets/regions/06-pond-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "7": {
  "src": "assets/regions/07-harbor-v1.webp",
  "preview": "assets/regions/07-harbor-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "8": {
  "src": "assets/regions/08-hotel-v1.webp",
  "preview": "assets/regions/08-hotel-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "9": {
  "src": "assets/regions/09-alley-v1.webp",
  "preview": "assets/regions/09-alley-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "10": {
  "src": "assets/regions/10-town-hall-v1.webp",
  "preview": "assets/regions/10-town-hall-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "11": {
  "src": "assets/regions/11-fire-station-v1.webp",
  "preview": "assets/regions/11-fire-station-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "12": {
  "src": "assets/regions/12-mountain-trail-v1.webp",
  "preview": "assets/regions/12-mountain-trail-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "13": {
  "src": "assets/regions/13-cemetery-v1.webp",
  "preview": "assets/regions/13-cemetery-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "14": {
  "src": "assets/regions/14-tunnel-v1.webp",
  "preview": "assets/regions/14-tunnel-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "15": {
  "src": "assets/regions/15-temple-v1.webp",
  "preview": "assets/regions/15-temple-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "16": {
  "src": "assets/regions/16-lighthouse-v1.webp",
  "preview": "assets/regions/16-lighthouse-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 43%"
 },
 "17": {
  "src": "assets/regions/17-archery-range-v1.webp",
  "preview": "assets/regions/17-archery-range-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "18": {
  "src": "assets/regions/18-hospital-v1.webp",
  "preview": "assets/regions/18-hospital-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "46% 46%"
 },
 "19": {
  "src": "assets/regions/19-beach-v1.webp",
  "preview": "assets/regions/19-beach-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "20": {
  "src": "assets/regions/20-well-v1.webp",
  "preview": "assets/regions/20-well-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "21": {
  "src": "assets/regions/21-slums-v1.webp",
  "preview": "assets/regions/21-slums-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 },
 "22": {
  "src": "assets/regions/22-research-lab-v1.webp",
  "preview": "assets/regions/22-research-lab-v2-preview.webp",
  "width": 1672,
  "height": 941,
  "position": "50% 48%"
 }
};
function regionScene(id){
 const art=window.REGION_ART[id];if(!art)return '';
 return `<img class="forest region-scene regional-art" data-scene="${id}" src="${art.src}" width="${art.width}" height="${art.height}" alt="" aria-hidden="true" draggable="false" decoding="async" fetchpriority="high" style="object-position:${art.position};background-image:url('${art.preview}');background-size:cover;background-position:${art.position}">`;
}
