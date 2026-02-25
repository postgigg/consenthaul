import { describe, it, expect, beforeEach } from 'vitest';
import { consentTools } from '../../tools/consents.js';
import { createMockClient } from '../helpers/mock-client.js';
describe('consent tools', () => {
    let client;
    beforeEach(() => {
        client = createMockClient();
    });
    // -----------------------------------------------------------------------
    // Schema validation
    // -----------------------------------------------------------------------
    describe('list_consents schema', () => {
        const schema = consentTools.list_consents.inputSchema;
        it('accepts empty input', () => {
            expect(schema.safeParse({}).success).toBe(true);
        });
        it('validates status enum', () => {
            expect(schema.safeParse({ status: 'signed' }).success).toBe(true);
            expect(schema.safeParse({ status: 'invalid_status' }).success).toBe(false);
        });
        it('validates driver_id as UUID', () => {
            expect(schema.safeParse({ driver_id: 'not-uuid' }).success).toBe(false);
            expect(schema.safeParse({ driver_id: '00000000-0000-4000-a000-000000000001' }).success).toBe(true);
        });
        it('rejects per_page > 100', () => {
            expect(schema.safeParse({ per_page: 101 }).success).toBe(false);
        });
    });
    describe('create_consent schema', () => {
        const schema = consentTools.create_consent.inputSchema;
        it('requires driver_id and delivery_method', () => {
            expect(schema.safeParse({}).success).toBe(false);
            expect(schema.safeParse({ driver_id: '00000000-0000-4000-a000-000000000001' }).success).toBe(false);
        });
        it('accepts valid input', () => {
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'sms',
            }).success).toBe(true);
        });
        it('validates delivery_method enum', () => {
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'telegram',
            }).success).toBe(false);
        });
        it('validates language enum', () => {
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'sms',
                language: 'fr',
            }).success).toBe(false);
        });
        it('validates consent_type enum', () => {
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'email',
                consent_type: 'blanket',
            }).success).toBe(true);
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'email',
                consent_type: 'invalid',
            }).success).toBe(false);
        });
    });
    describe('consent_id schemas', () => {
        const schemas = [
            consentTools.get_consent.inputSchema,
            consentTools.revoke_consent.inputSchema,
            consentTools.resend_consent.inputSchema,
            consentTools.get_consent_pdf_url.inputSchema,
        ];
        schemas.forEach((schema, i) => {
            it(`schema ${i} requires valid consent_id UUID`, () => {
                expect(schema.safeParse({}).success).toBe(false);
                expect(schema.safeParse({ consent_id: 'bad' }).success).toBe(false);
                expect(schema.safeParse({ consent_id: '00000000-0000-4000-a000-000000000001' }).success).toBe(true);
            });
        });
    });
    // -----------------------------------------------------------------------
    // Handler behavior
    // -----------------------------------------------------------------------
    describe('list_consents handler', () => {
        it('calls client.get with /consents and query params', async () => {
            await consentTools.list_consents.handler(client, {
                status: 'signed',
                driver_id: '00000000-0000-4000-a000-000000000001',
                page: 2,
                per_page: 10,
            });
            expect(client.get).toHaveBeenCalledWith('/consents', {
                status: 'signed',
                driver_id: '00000000-0000-4000-a000-000000000001',
                page: '2',
                per_page: '10',
                created_after: undefined,
                created_before: undefined,
            });
        });
    });
    describe('get_consent handler', () => {
        it('calls client.get with /consents/:id', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await consentTools.get_consent.handler(client, { consent_id: id });
            expect(client.get).toHaveBeenCalledWith(`/consents/${id}`);
        });
    });
    describe('create_consent handler', () => {
        it('calls client.post with /consents', async () => {
            const input = {
                driver_id: '00000000-0000-4000-a000-000000000001',
                delivery_method: 'sms',
            };
            await consentTools.create_consent.handler(client, input);
            expect(client.post).toHaveBeenCalledWith('/consents', input);
        });
    });
    describe('revoke_consent handler', () => {
        it('calls client.post with /consents/:id/revoke', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await consentTools.revoke_consent.handler(client, { consent_id: id });
            expect(client.post).toHaveBeenCalledWith(`/consents/${id}/revoke`);
        });
    });
    describe('resend_consent handler', () => {
        it('calls client.post with /consents/:id/resend', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await consentTools.resend_consent.handler(client, { consent_id: id });
            expect(client.post).toHaveBeenCalledWith(`/consents/${id}/resend`);
        });
    });
    describe('get_consent_pdf_url handler', () => {
        it('calls client.get with /consents/:id/pdf', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await consentTools.get_consent_pdf_url.handler(client, { consent_id: id });
            expect(client.get).toHaveBeenCalledWith(`/consents/${id}/pdf`);
        });
    });
});
