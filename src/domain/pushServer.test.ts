import { describe, expect, it } from 'vitest';
import { failedToken, isWithinQuietHours, pushLanguages, renderPush } from '../../supabase/functions/_shared/push';

describe('server push rendering', () => {
  it('renders every supported recipient language', () => {
    for (const language of pushLanguages) {
      const result = renderPush('new_rsvp', language, { count: 5, total: 132 });
      expect(result.title.length).toBeGreaterThan(2);
      expect(result.body).toContain('5');
      expect(result.body).toContain('132');
      expect(result.body).not.toContain('{{');
    }
  });
  it('falls back safely and leaves no unresolved missing variable marker', () => {
    expect(renderPush('task_due', 'fr', { task: 'Deposit' }).body).toBe('Tugasan “Deposit” tamat ');
  });
  it('has complete copy for every scheduled and event template in all languages', () => {
    const templates = ['task_due','new_rsvp','payment_due','vendor_lead','package_active','billing_issue','vendor_weekly_summary','new_message','quotation_response','new_review','verification','countdown','rsvp_pending','lead_unanswered','event_followup','task_assigned','over_budget','booking_confirmed','member_joined','payment_recorded','event_day','admin_alert'] as const;
    const variables = { task:'Task',when:'tomorrow',count:2,total:10,amount:'RM100',vendor:'Vendor',date:'1 Jan',event:'Event',location:'KL',pax:100,package:'Pro',sender:'A',message:'Hello',number:'Q1',status:'accepted',rating:5,days:7,assigner:'A',percent:90,member:'B',kind:'Deposit',attendance:20,next:'Lunch' };
    for (const language of pushLanguages) for (const template of templates) {
      const rendered = renderPush(template, language, variables);
      expect(rendered.title.length).toBeGreaterThan(2);
      expect(rendered.body.length).toBeGreaterThan(2);
      expect(rendered.body).not.toContain('{{');
    }
  });
  it('handles overnight and daytime quiet periods', () => {
    expect(isWithinQuietHours(23)).toBe(true);
    expect(isWithinQuietHours(12)).toBe(false);
    expect(isWithinQuietHours(13, 9, 17)).toBe(true);
  });
  it('only removes tokens for DeviceNotRegistered errors', () => {
    expect(failedToken({ status: 'error', details: { error: 'DeviceNotRegistered' } })).toBe(true);
    expect(failedToken({ status: 'error', details: { error: 'MessageTooBig' } })).toBe(false);
    expect(failedToken({ status: 'ok' })).toBe(false);
  });
});
