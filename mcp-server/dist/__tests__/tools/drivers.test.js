import { describe, it, expect, beforeEach } from 'vitest';
import { driverTools } from '../../tools/drivers.js';
import { createMockClient } from '../helpers/mock-client.js';
describe('driver tools', () => {
    let client;
    beforeEach(() => {
        client = createMockClient();
    });
    // -----------------------------------------------------------------------
    // Schema validation
    // -----------------------------------------------------------------------
    describe('list_drivers schema', () => {
        const schema = driverTools.list_drivers.inputSchema;
        it('accepts empty input', () => {
            expect(schema.safeParse({}).success).toBe(true);
        });
        it('accepts valid filters', () => {
            const result = schema.safeParse({ search: 'john', page: 1, per_page: 50, is_active: true });
            expect(result.success).toBe(true);
        });
        it('rejects per_page > 100', () => {
            expect(schema.safeParse({ per_page: 101 }).success).toBe(false);
        });
        it('rejects non-integer page', () => {
            expect(schema.safeParse({ page: 1.5 }).success).toBe(false);
        });
    });
    describe('get_driver schema', () => {
        const schema = driverTools.get_driver.inputSchema;
        it('requires valid UUID', () => {
            expect(schema.safeParse({ driver_id: 'not-a-uuid' }).success).toBe(false);
        });
        it('accepts valid UUID', () => {
            expect(schema.safeParse({ driver_id: '00000000-0000-4000-a000-000000000001' }).success).toBe(true);
        });
    });
    describe('create_driver schema', () => {
        const schema = driverTools.create_driver.inputSchema;
        it('requires first_name and last_name', () => {
            expect(schema.safeParse({}).success).toBe(false);
            expect(schema.safeParse({ first_name: 'A' }).success).toBe(false);
        });
        it('accepts minimal input', () => {
            expect(schema.safeParse({ first_name: 'John', last_name: 'Doe' }).success).toBe(true);
        });
        it('validates email format', () => {
            expect(schema.safeParse({ first_name: 'A', last_name: 'B', email: 'bad' }).success).toBe(false);
        });
        it('validates cdl_state length', () => {
            expect(schema.safeParse({ first_name: 'A', last_name: 'B', cdl_state: 'TEX' }).success).toBe(false);
        });
    });
    describe('update_driver schema', () => {
        const schema = driverTools.update_driver.inputSchema;
        it('requires driver_id', () => {
            expect(schema.safeParse({ first_name: 'Updated' }).success).toBe(false);
        });
        it('rejects invalid UUID for driver_id', () => {
            expect(schema.safeParse({ driver_id: 'nope' }).success).toBe(false);
        });
        it('accepts driver_id with optional fields', () => {
            expect(schema.safeParse({
                driver_id: '00000000-0000-4000-a000-000000000001',
                first_name: 'Updated',
            }).success).toBe(true);
        });
    });
    // -----------------------------------------------------------------------
    // Handler behavior
    // -----------------------------------------------------------------------
    describe('list_drivers handler', () => {
        it('calls client.get with /drivers and query params', async () => {
            await driverTools.list_drivers.handler(client, { search: 'john', page: 2, per_page: 10, is_active: true });
            expect(client.get).toHaveBeenCalledWith('/drivers', {
                search: 'john',
                page: '2',
                per_page: '10',
                is_active: 'true',
            });
        });
        it('converts undefined optional params', async () => {
            await driverTools.list_drivers.handler(client, {});
            expect(client.get).toHaveBeenCalledWith('/drivers', {
                search: undefined,
                page: undefined,
                per_page: undefined,
                is_active: undefined,
            });
        });
    });
    describe('get_driver handler', () => {
        it('calls client.get with /drivers/:id', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await driverTools.get_driver.handler(client, { driver_id: id });
            expect(client.get).toHaveBeenCalledWith(`/drivers/${id}`);
        });
    });
    describe('create_driver handler', () => {
        it('calls client.post with /drivers', async () => {
            const input = { first_name: 'Jane', last_name: 'Smith', phone: '+15551234567' };
            await driverTools.create_driver.handler(client, input);
            expect(client.post).toHaveBeenCalledWith('/drivers', input);
        });
    });
    describe('update_driver handler', () => {
        it('strips driver_id from body and PATCHes correct path', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await driverTools.update_driver.handler(client, { driver_id: id, first_name: 'Updated' });
            expect(client.patch).toHaveBeenCalledWith(`/drivers/${id}`, { first_name: 'Updated' });
        });
    });
    describe('deactivate_driver handler', () => {
        it('PATCHes with is_active: false', async () => {
            const id = '00000000-0000-4000-a000-000000000001';
            await driverTools.deactivate_driver.handler(client, { driver_id: id });
            expect(client.patch).toHaveBeenCalledWith(`/drivers/${id}`, { is_active: false });
        });
    });
});
