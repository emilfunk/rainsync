import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TagInputModal } from '../src/content/tag-input-modal';

describe('TagInputModal', () => {
  let modal: TagInputModal;

  beforeEach(() => {
    // Clear the document body before each test
    document.body.innerHTML = '';
    modal = new TagInputModal();
  });

  afterEach(() => {
    // Clean up any remaining modals
    const existingModal = document.getElementById('rainsync-tag-modal');
    if (existingModal) {
      existingModal.remove();
    }
  });

  describe('Modal Creation', () => {
    it('should create modal in the DOM when shown', async () => {
      const showPromise = modal.show();

      // Wait for next tick to allow modal to be created
      await new Promise(resolve => setTimeout(resolve, 0));

      const modalElement = document.getElementById('rainsync-tag-modal');
      expect(modalElement).toBeTruthy();
      expect(modalElement?.tagName).toBe('DIV');

      // Close the modal
      const skipButton = document.getElementById('rainsync-skip-btn') as HTMLButtonElement;
      skipButton?.click();
      await showPromise;
    });

    it('should have input field, save button, and skip button', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input');
      const saveButton = document.getElementById('rainsync-save-btn');
      const skipButton = document.getElementById('rainsync-skip-btn');

      expect(input).toBeTruthy();
      expect(saveButton).toBeTruthy();
      expect(skipButton).toBeTruthy();

      // Close the modal
      skipButton?.click();
      await showPromise;
    });

    it('should have proper placeholder text', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      expect(input?.placeholder).toBe('e.g., research, inspiration, todo');

      // Close the modal
      const skipButton = document.getElementById('rainsync-skip-btn') as HTMLButtonElement;
      skipButton?.click();
      await showPromise;
    });
  });

  describe('User Input Handling', () => {
    it('should return custom tag when save button is clicked with input', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = 'research';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBe('research');
    });

    it('should return null when skip button is clicked', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const skipButton = document.getElementById('rainsync-skip-btn') as HTMLButtonElement;
      skipButton.click();

      const result = await showPromise;
      expect(result).toBeNull();
    });

    it('should return null when save is clicked with empty input', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = '';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBeNull();
    });

    it('should trim whitespace from input', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = '  research  ';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBe('research');
    });

    it('should return null when input contains only whitespace', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = '   ';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBeNull();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save tag when Enter key is pressed', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      input.value = 'todo';

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);

      const result = await showPromise;
      expect(result).toBe('todo');
    });

    it('should skip when Escape key is pressed', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      input.value = 'something';

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);

      const result = await showPromise;
      expect(result).toBeNull();
    });
  });

  describe('Modal Cleanup', () => {
    it('should remove modal from DOM after save', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;
      saveButton.click();

      await showPromise;

      const modalElement = document.getElementById('rainsync-tag-modal');
      expect(modalElement).toBeNull();
    });

    it('should remove modal from DOM after skip', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const skipButton = document.getElementById('rainsync-skip-btn') as HTMLButtonElement;
      skipButton.click();

      await showPromise;

      const modalElement = document.getElementById('rainsync-tag-modal');
      expect(modalElement).toBeNull();
    });

    it('should close modal when clicking outside', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const modalOverlay = document.getElementById('rainsync-tag-modal');
      modalOverlay?.click();

      const result = await showPromise;
      expect(result).toBeNull();

      const modalElement = document.getElementById('rainsync-tag-modal');
      expect(modalElement).toBeNull();
    });

    it('should not close modal when clicking on modal content', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      input.click();

      // Wait a bit to ensure it doesn't close
      await new Promise(resolve => setTimeout(resolve, 50));

      const modalElement = document.getElementById('rainsync-tag-modal');
      expect(modalElement).toBeTruthy();

      // Clean up
      const skipButton = document.getElementById('rainsync-skip-btn') as HTMLButtonElement;
      skipButton.click();
      await showPromise;
    });
  });

  describe('Multiple Tags', () => {
    it('should handle tags with hyphens', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = 'work-related';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBe('work-related');
    });

    it('should handle tags with underscores', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = 'must_read';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBe('must_read');
    });

    it('should handle tags with numbers', async () => {
      const showPromise = modal.show();

      await new Promise(resolve => setTimeout(resolve, 0));

      const input = document.getElementById('rainsync-tag-input') as HTMLInputElement;
      const saveButton = document.getElementById('rainsync-save-btn') as HTMLButtonElement;

      input.value = 'project2024';
      saveButton.click();

      const result = await showPromise;
      expect(result).toBe('project2024');
    });
  });
});
