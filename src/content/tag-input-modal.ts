import { logger } from '../shared/utils/logger';

/**
 * Modal component for collecting custom tags from users
 */
export class TagInputModal {
  private modal: HTMLElement | null = null;
  private resolveCallback: ((tag: string | null) => void) | null = null;

  /**
   * Show the modal and wait for user input
   * @returns Promise that resolves with the tag (or null if skipped)
   */
  async show(): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      this.createModal();
      this.attachEventListeners();
    });
  }

  /**
   * Create the modal DOM elements
   */
  private createModal(): void {
    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.id = 'rainsync-tag-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      width: 400px;
      max-width: 90%;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Add a tag for this bookmark';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
      color: #0f1419;
    `;

    // Description
    const description = document.createElement('p');
    description.textContent = 'Add a custom tag to help organize this bookmark (optional)';
    description.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #536471;
    `;

    // Input field
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'rainsync-tag-input';
    input.placeholder = 'e.g., research, inspiration, todo';
    input.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #cfd9de;
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
      outline: none;
      margin-bottom: 16px;
    `;

    // Focus style
    input.addEventListener('focus', () => {
      input.style.borderColor = '#1da1f2';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#cfd9de';
    });

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    // Skip button
    const skipButton = document.createElement('button');
    skipButton.id = 'rainsync-skip-btn';
    skipButton.textContent = 'Skip';
    skipButton.style.cssText = `
      padding: 10px 20px;
      border: 1px solid #cfd9de;
      border-radius: 9999px;
      background: white;
      color: #0f1419;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    skipButton.addEventListener('mouseenter', () => {
      skipButton.style.backgroundColor = '#f7f9f9';
    });
    skipButton.addEventListener('mouseleave', () => {
      skipButton.style.backgroundColor = 'white';
    });

    // Save button
    const saveButton = document.createElement('button');
    saveButton.id = 'rainsync-save-btn';
    saveButton.textContent = 'Save';
    saveButton.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 9999px;
      background: #1da1f2;
      color: white;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.backgroundColor = '#1a8cd8';
    });
    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.backgroundColor = '#1da1f2';
    });

    // Assemble modal
    buttonContainer.appendChild(skipButton);
    buttonContainer.appendChild(saveButton);
    modalContent.appendChild(title);
    modalContent.appendChild(description);
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    this.modal.appendChild(modalContent);

    // Add to DOM
    document.body.appendChild(this.modal);

    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  /**
   * Attach event listeners to buttons and input
   */
  private attachEventListeners(): void {
    if (!this.modal) return;

    const input = this.modal.querySelector('#rainsync-tag-input') as HTMLInputElement;
    const saveButton = this.modal.querySelector('#rainsync-save-btn') as HTMLButtonElement;
    const skipButton = this.modal.querySelector('#rainsync-skip-btn') as HTMLButtonElement;

    // Save on button click
    saveButton?.addEventListener('click', () => {
      const tag = input?.value.trim() || null;
      this.close(tag);
    });

    // Skip on button click
    skipButton?.addEventListener('click', () => {
      this.close(null);
    });

    // Save on Enter key
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const tag = input.value.trim() || null;
        this.close(tag);
      } else if (e.key === 'Escape') {
        this.close(null);
      }
    });

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close(null);
      }
    });
  }

  /**
   * Close the modal and resolve with the tag value
   */
  private close(tag: string | null): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }

    if (this.resolveCallback) {
      logger.info('Tag input modal closed', { tag });
      this.resolveCallback(tag);
      this.resolveCallback = null;
    }
  }
}
