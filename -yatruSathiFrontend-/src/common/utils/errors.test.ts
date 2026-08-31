import { describe, expect, it } from 'vitest';
import { getApiErrorCode, getApiErrorMessage } from './errors';
import { MESSAGES } from '../constants/messages';

describe('getApiErrorMessage', () => {
  it('reads the new { error: { message } } envelope', () => {
    const err = { response: { data: { error: { code: 'conflict', message: 'Already booked' } } } };
    expect(getApiErrorMessage(err)).toBe('Already booked');
  });

  it('reads the legacy { error: "..." } string shape', () => {
    const err = { response: { data: { error: 'Invalid credentials' } } };
    expect(getApiErrorMessage(err)).toBe('Invalid credentials');
  });

  it('reads a DRF { detail: "..." } response', () => {
    const err = { response: { data: { detail: 'Not found.' } } };
    expect(getApiErrorMessage(err)).toBe('Not found.');
  });

  it('reads the first serializer field error', () => {
    const err = { response: { data: { email: ['This field is required.'] } } };
    expect(getApiErrorMessage(err)).toBe('This field is required.');
  });

  it('maps a network error to the network message', () => {
    expect(getApiErrorMessage({ code: 'ERR_NETWORK' })).toBe(MESSAGES.networkError);
  });

  it('falls back when there is nothing usable', () => {
    expect(getApiErrorMessage(null)).toBe(MESSAGES.genericError);
    expect(getApiErrorMessage({}, 'custom fallback')).toBe('custom fallback');
  });
});

describe('getApiErrorCode', () => {
  it('extracts the machine-readable code from the envelope', () => {
    const err = { response: { data: { error: { code: 'permission_denied', message: 'no' } } } };
    expect(getApiErrorCode(err)).toBe('permission_denied');
  });

  it('returns undefined when there is no code', () => {
    expect(getApiErrorCode({ response: { data: { error: 'plain' } } })).toBeUndefined();
    expect(getApiErrorCode(null)).toBeUndefined();
  });
});
