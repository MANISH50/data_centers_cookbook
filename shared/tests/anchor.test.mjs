import test from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, speakable, holdAt, HOLD_EDGE } from '../anchor.js';

const V = (name, lang, extra = {}) => ({ name, lang, ...extra });

test('pickVoice prefers a woman’s English voice, and the better online ones', () => {
  const voices = [V('Daniel', 'en-GB', { default: true }), V('Samantha', 'en-US'), V('Thomas', 'fr-FR'), V('Google UK English Male', 'en-GB')];
  assert.equal(pickVoice(voices).name, 'Samantha');
  assert.equal(pickVoice([V('Microsoft David', 'en-US'), V('Microsoft Aria Online (Natural) - English (United States)', 'en-US'), V('Microsoft Zira', 'en-US')]).name, 'Microsoft Aria Online (Natural) - English (United States)');
  assert.equal(pickVoice([V('Google UK English Male', 'en-GB'), V('Google UK English Female', 'en-GB')]).name, 'Google UK English Female');
  assert.equal(pickVoice([V('Rishi', 'en-IN'), V('Veena', 'en-IN')]).name, 'Veena');
});
test('pickVoice falls back to any English voice, and to null with none', () => {
  assert.equal(pickVoice([V('Fred', 'en-US'), V('Amélie', 'fr-CA')]).name, 'Fred');
  assert.equal(pickVoice([V('Amélie', 'fr-CA')]), null);
  assert.equal(pickVoice([]), null);
  assert.equal(pickVoice(undefined), null);
  assert.equal(pickVoice([V('Karen', 'en_AU')]).name, 'Karen');
});
test('speakable spells out units and symbols', () => {
  assert.equal(speakable('You pay ₹20 for tea'), 'You pay 20 rupees for tea');
  assert.equal(speakable('about 14.5 kW per system'), 'about 14.5 kilowatts per system');
  assert.equal(speakable('≈ 0.63 kWh for every litre'), 'about 0.63 kilowatt hours for every litre');
  assert.equal(speakable('415 TWh in 2024'), '415 terawatt hours in 2024');
  assert.equal(speakable('Mumbai to London is 7,200 km, so 72 ms'), 'Mumbai to London is 7,200 kilometres, so 72 milliseconds');
  assert.equal(speakable('grid → substation'), 'grid, then substation');
  assert.equal(speakable('WUE 0.30 L/kWh (FY24)'), 'WUE 0.30 litres per kilowatt hour (financial year 2024)');
  assert.equal(speakable('“What is example.com?”'), 'What is example.com?');
  assert.equal(speakable('18–27 °C'), '18 to 27 degrees Celsius');
  assert.equal(speakable('132–140 kW per rack'), '132 to 140 kilowatts per rack');
  assert.equal(speakable('2 m tall and 60 cm wide'), '2 metres tall and 60 centimetres wide');
  assert.equal(speakable('Height is 1U'), 'Height is 1U');
});
test('holdAt waits at the end of the beat only while the guide is talking', () => {
  const end = 10;
  assert.equal(holdAt(5, end, true, 4.9), 5);
  assert.equal(holdAt(10.2, end, false, 9.99), 10.2);
  assert.equal(holdAt(10.2, end, true, 9.9), end - HOLD_EDGE);
  assert.equal(holdAt(10.2, end, true, end - HOLD_EDGE), end - HOLD_EDGE);
  assert.ok(holdAt(10.2, end, true, 9.9) < end, 'never crosses into the next beat while talking');
});
