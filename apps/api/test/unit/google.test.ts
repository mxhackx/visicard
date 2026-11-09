import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGoogleClaims } from '../../src/auth/google.ts';

const ID = 'client-123.apps.googleusercontent.com';
const ok = { aud: ID, iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 600), email: ' Awa@Example.com ', email_verified: 'true', name: 'Awa K.' };

test('Google : jeton valide', () => {
  assert.deepEqual(checkGoogleClaims(ok, ID), { email: 'awa@example.com', name: 'Awa K.', picture: null });
  assert.equal(checkGoogleClaims({ ...ok, iss: 'accounts.google.com', email_verified: true }, ID).email, 'awa@example.com');
});

test('Google : refuse un jeton d’une autre application, expiré, non vérifié ou mal émis', () => {
  assert.throws(() => checkGoogleClaims({ ...ok, aud: 'autre' }, ID), /autre application/);
  assert.throws(() => checkGoogleClaims({ ...ok, exp: '1' }, ID), /expiré/);
  assert.throws(() => checkGoogleClaims({ ...ok, email_verified: 'false' }, ID), /vérifiée/);
  assert.throws(() => checkGoogleClaims({ ...ok, iss: 'https://evil.example' }, ID), /Émetteur/);
  assert.throws(() => checkGoogleClaims({ ...ok, email: 'pas-un-mail' }, ID), /invalide/);
});

test('Google : la photo de profil n’est gardée que si c’est une adresse https', () => {
  assert.equal(checkGoogleClaims({ ...ok, picture: 'https://lh3.googleusercontent.com/a/abc=s96-c' }, ID).picture, 'https://lh3.googleusercontent.com/a/abc=s96-c');
  assert.equal(checkGoogleClaims({ ...ok, picture: 'http://exemple.com/a.png' }, ID).picture, null);
  assert.equal(checkGoogleClaims({ ...ok, picture: 'javascript:alert(1)' }, ID).picture, null);
  assert.equal(checkGoogleClaims(ok, ID).picture, null);
});
