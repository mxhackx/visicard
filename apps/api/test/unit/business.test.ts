import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCatalog, publicCatalog } from '../../src/cards/catalog.ts';
import { resolveGeo } from '../../src/cards/geo.ts';
import { buildPayload } from '../../src/developers/payloads.ts';

test('catalogue : valide, arrondit et plafonne', () => {
  const c = parseCatalog({
    promo: { title: ' -20 % ', text: 'ce week-end', until: '2030-01-01' },
    products: [{ name: 'Poisson', price: '3500.4', description: 'x' }, { name: '' }, { name: 'Eau', price: '' }],
  });
  assert.equal(c.promo?.title, '-20 %');
  assert.equal(c.products.length, 2);
  assert.equal(c.products[0].price, 3500);
  assert.equal(c.products[1].price, null);
  assert.ok(c.products[0].id.length > 4);
});

test('catalogue : refuse un prix négatif, une image non http et plus de 60 produits', () => {
  assert.throws(() => parseCatalog({ products: [{ name: 'A', price: -1 }] }));
  assert.throws(() => parseCatalog({ products: [{ name: 'A', image: 'javascript:alert(1)' }] }));
  assert.throws(() => parseCatalog({ products: Array.from({ length: 61 }, (_, i) => ({ name: `P${i}` })) }));
  assert.throws(() => parseCatalog({ promo: { title: 'x', until: 'demain' } }));
});

test('catalogue public : une promotion échue disparaît', () => {
  assert.equal(publicCatalog({ promo: { title: 'Vieille promo', until: '2020-01-01' }, products: [] }).promo, null);
  assert.equal(publicCatalog({ promo: { title: 'Future', until: '2999-01-01' } }).promo?.title, 'Future');
  assert.deepEqual(publicCatalog('pas du json valide'), { promo: null, products: [] });
});

test('localisation : en-têtes de l’hébergeur, sinon langue et fuseau, jamais de ville déduite du fuseau', () => {
  assert.deepEqual(resolveGeo({ 'x-vercel-ip-country': 'SN', 'x-vercel-ip-city': 'Saint-Louis' }), { country: 'SN', city: 'Saint-Louis' });
  assert.deepEqual(resolveGeo({}, 'Africa/Porto-Novo', 'fr-BJ'), { country: 'BJ', city: null });
  assert.deepEqual(resolveGeo({}, 'Africa/Abidjan', 'fr'), { country: 'CI', city: null });
  assert.deepEqual(resolveGeo({}, 'Mars/Olympus', 'xx'), { country: null, city: null });
  assert.equal(resolveGeo({ 'cf-ipcountry': 'XX' }).country, null);
});

test('API v1 : contenus des QR codes', () => {
  assert.equal(buildPayload('tel', { phone: '+229 97 00 00 00' }), 'tel:+22997000000');
  assert.equal(buildPayload('wifi', { ssid: 'Mon;Wifi', password: 'a:b', security: 'WPA' }), 'WIFI:T:WPA;S:Mon\\;Wifi;P:a\\:b;;');
  assert.equal(buildPayload('geo', { lat: 6.36, lng: 2.41 }), 'geo:6.36,2.41');
  assert.equal(buildPayload('wifi', { ssid: 'a\\b', security: 'nopass' }), 'WIFI:T:nopass;S:a\\\\b;;');
  assert.throws(() => buildPayload('url', { data: 'pas une url' }));
  assert.throws(() => buildPayload('geo', { lat: 200, lng: 0 }));
  assert.throws(() => buildPayload('inconnu', {}));
});
