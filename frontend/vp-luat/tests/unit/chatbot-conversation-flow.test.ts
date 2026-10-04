import { describe, it, expect } from 'vitest';
import { createConversationFlow, processUserInput } from '@/features/chatbot/config/conversation-flow';

// Minimal stub matching the Translator contract used by the chatbot flow:
// accepts a key and returns the key itself. That keeps the assertions focused
// on routing behaviour rather than i18n string resolution.
const t = ((key: string, values?: Record<string, string | number>) => {
  if (!values) return key;
  return `${key}|${Object.entries(values).map(([k, v]) => `${k}=${v}`).join('&')}`;
}) as unknown as Parameters<typeof createConversationFlow>[0];

t.raw = (key: string) => key;

const flow = createConversationFlow(t);

describe('conversation-flow', () => {
  describe('script routing via flow.processUserInput', () => {
    it('greeting: routes doanh nghiep correctly', () => {
      const result = flow.processUserInput('greeting', 'doanh nghiệp');
      expect(result.botMessages).toHaveLength(1);
      expect(result.botMessages[0].from).toBe('bot');
      expect(result.nextState).toBe('service_selected');
    });

    it('greeting: routes land/real estate correctly', () => {
      const result = flow.processUserInput('greeting', 'đất đai');
      expect(result.nextState).toBe('service_selected');
    });

    it('greeting: routes civil law correctly', () => {
      const result = flow.processUserInput('greeting', 'luật dân sự');
      expect(result.nextState).toBe('service_selected');
    });

    it('greeting: routes criminal law correctly', () => {
      const result = flow.processUserInput('greeting', 'luật hình sự');
      expect(result.nextState).toBe('service_selected');
    });

    it('greeting: unknown input returns greeting passthrough', () => {
      const result = flow.processUserInput('greeting', 'asdfghjkl');
      expect(result.nextState).toBe('greeting');
      expect(result.passthrough).toBe(true);
    });

    it('service_selected: company setup routes correctly', () => {
      const result = flow.processUserInput('service_selected', 'Thành lập công ty');
      expect(result.nextState).toBe('company_setup');
    });

    it('company_setup: booking routes to lead_name', () => {
      const result = flow.processUserInput('company_setup', 'Đặt lịch tư vấn');
      expect(result.nextState).toBe('lead_name');
    });

    it('lead_name: returns phone prompt with last 2 words of name', () => {
      const result = flow.processUserInput('lead_name', 'Nguyễn Văn A');
      expect(result.nextState).toBe('lead_phone');
      // Phone prompt passes the last 2 words ("Văn A") into the t() call.
      expect(result.botMessages[0].content).toContain('Văn A');
    });

    it('lead_phone: completes with handoff', () => {
      const result = flow.processUserInput('lead_phone', '0912345678');
      expect(result.nextState).toBe('lead_complete');
      expect(result.botMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('processUserInput (top-level helper)', () => {
    it('routes unknown state to greeting', () => {
      const result = processUserInput(t, 'idle', 'hello');
      expect(result.botMessages[0].from).toBe('bot');
    });

    it('processes greeting state via script', () => {
      const result = processUserInput(t, 'greeting', 'doanh nghiệp');
      expect(result.nextState).toBe('service_selected');
    });

    it('processes lead_name state correctly', () => {
      const result = processUserInput(t, 'lead_name', 'Test User');
      expect(result.nextState).toBe('lead_phone');
    });
  });
});
