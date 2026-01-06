export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition = 
  | 'top-start' 
  | 'top-center' 
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  position?: ToastPosition;
}

interface ToastData {
  element: HTMLElement;
  duration: number;
  timeoutId: NodeJS.Timeout | null;
}

// Default toast settings (matching your specifications)
const defaultSettings = {
  bgColor: '#ffffff',
  titleColor: '#111827',
  messageColor: '#111827',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderRadius: 7,
  padding: 10,
  width: 340,
  minWidth: 300,
  maxWidth: 360,
  height: 'auto',
  minHeight: 60,
  maxHeight: 'none',
  iconSize: 24,
  iconSuccessColor: '#10b981',
  iconErrorColor: '#ef4444',
  iconWarningColor: '#f59e0b',
  iconInfoColor: '#3b82f6',
  showIcon: true,
  titleSize: 15,
  messageSize: 15,
  titleWeight: 700,
  messageWeight: 600,
  shadowBlur: 15,
  shadowOpacity: 0.05,
  showProgress: false,
  showClose: true,
  entranceAnimation: 'slideUp',
  exitAnimation: 'slideDownOut',
  mobileEntranceAnimation: 'slideUp',
  mobileExitAnimation: 'slideDownOut',
  animationDuration: 250,
  animationEasing: 'ease-in',
  maxToastCount: 3,
};

class CustomToast {
  private container: HTMLElement | null = null;
  private toastIdCounter = 0;
  private defaultPosition: ToastPosition = 'bottom-end';
  private toasts = new Map<string, ToastData>();
  private toastQueue: Array<{ options: ToastOptions; id: string }> = [];
  private stylesInjected = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  private init() {
    this.injectStyles();
    this.createContainer();
  }

  private injectStyles() {
    if (this.stylesInjected) return;
    this.stylesInjected = true;

    const style = document.createElement('style');
    style.id = 'custom-toast-styles';
    style.textContent = `
      #toast-container {
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        width: auto;
      }

      .toast-top-start { top: 0; left: 0; align-items: flex-start; }
      .toast-top-center { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }
      .toast-top-end { top: 0; right: 0; align-items: flex-end; }
      .toast-middle-start { top: 50%; left: 0; transform: translateY(-50%); align-items: flex-start; }
      .toast-middle-center { top: 50%; left: 50%; transform: translate(-50%, -50%); align-items: center; }
      .toast-middle-end { top: 50%; right: 0; transform: translateY(-50%); align-items: flex-end; }
      .toast-bottom-start { bottom: 0; left: 0; align-items: flex-start; }
      .toast-bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; }
      .toast-bottom-end { bottom: 0; right: 0; align-items: flex-end; }

      .toast-item {
        background: ${defaultSettings.bgColor};
        border-radius: ${defaultSettings.borderRadius}px;
        box-shadow: 0 10px ${defaultSettings.shadowBlur}px rgba(0, 0, 0, ${defaultSettings.shadowOpacity}), 0 2px 8px rgba(0, 0, 0, ${defaultSettings.shadowOpacity * 0.7});
        padding: ${defaultSettings.padding}px ${defaultSettings.padding + 4}px;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        overflow: hidden;
        border: ${defaultSettings.borderWidth}px solid ${defaultSettings.borderColor};
        width: ${defaultSettings.width}px;
        min-width: ${defaultSettings.minWidth}px;
        max-width: ${defaultSettings.maxWidth}px;
        height: ${typeof defaultSettings.height === 'number' ? `${defaultSettings.height}px` : defaultSettings.height};
        min-height: ${defaultSettings.minHeight}px;
        max-height: ${typeof defaultSettings.maxHeight === 'number' ? `${defaultSettings.maxHeight}px` : defaultSettings.maxHeight};
      }

      .toast-icon {
        flex-shrink: 0;
        width: ${defaultSettings.iconSize}px;
        height: ${defaultSettings.iconSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 16px;
      }

      .toast-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .toast-title {
        font-size: ${defaultSettings.titleSize}px;
        font-weight: ${defaultSettings.titleWeight};
        color: ${defaultSettings.titleColor};
        line-height: 1.4;
      }

      .toast-message {
        font-size: ${defaultSettings.messageSize}px;
        font-weight: ${defaultSettings.messageWeight};
        color: ${defaultSettings.messageColor};
        line-height: 1.5;
      }

      /* When only message is shown (no title), use message styling */
      .toast-content:has(.toast-message:only-child) .toast-message {
        font-size: ${defaultSettings.messageSize}px;
        font-weight: ${defaultSettings.messageWeight};
        color: ${defaultSettings.messageColor};
      }

      .toast-close {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #9ca3af;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
        padding: 0;
        font-size: 18px;
        line-height: 1;
      }

      .toast-close:hover {
        background: #f3f4f6;
        color: #374151;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideUpOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-100%);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDownOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(100%);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes scaleOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.8);
        }
      }

      @media (max-width: 640px) {
        #toast-container {
          max-width: 100% !important;
          padding: 12px !important;
          width: 100% !important;
          bottom: 0 !important;
          top: auto !important;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
          align-items: stretch !important;
          gap: 12px !important;
        }
        /* Override ALL position classes on mobile to ensure bottom positioning */
        #toast-container.toast-top-start,
        #toast-container.toast-top-center,
        #toast-container.toast-top-end,
        #toast-container.toast-middle-start,
        #toast-container.toast-middle-center,
        #toast-container.toast-middle-end,
        #toast-container.toast-bottom-start,
        #toast-container.toast-bottom-center,
        #toast-container.toast-bottom-end {
          top: auto !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          transform: none !important;
        }
        .toast-item {
          min-width: 100% !important;
          max-width: 100% !important;
          width: 100% !important;
          border-radius: 8px !important;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createContainer() {
    if (this.container) return;

    const isMobile = window.innerWidth <= 640;
    const initialPosition = isMobile ? 'bottom-center' : this.defaultPosition;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = `toast-${initialPosition}`;
    
    // Apply base container styles
    this.container.style.position = 'fixed';
    this.container.style.zIndex = '10000';
    this.container.style.pointerEvents = 'none';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    
    // Apply mobile-specific styles with setProperty for !important
    if (isMobile) {
      this.container.style.setProperty('bottom', '0', 'important');
      this.container.style.setProperty('top', 'auto', 'important');
      this.container.style.setProperty('left', '0', 'important');
      this.container.style.setProperty('right', '0', 'important');
      this.container.style.setProperty('width', '100%', 'important');
      this.container.style.setProperty('max-width', '100%', 'important');
      this.container.style.setProperty('padding', '12px', 'important');
      this.container.style.setProperty('transform', 'none', 'important');
      this.container.style.gap = '12px';
      this.container.style.alignItems = 'stretch';
    }
    
    document.body.appendChild(this.container);
  }

  private updatePosition(position: ToastPosition) {
    this.defaultPosition = position;
    if (this.container) {
      const isMobile = window.innerWidth <= 640;
      
      this.container.className = this.container.className.replace(/toast-\w+-\w+/g, '');
      this.container.classList.add(`toast-${position}`);
      
      // Apply mobile styles directly via inline styles with !important
      if (isMobile) {
        this.container.style.setProperty('bottom', '0', 'important');
        this.container.style.setProperty('top', 'auto', 'important');
        this.container.style.setProperty('left', '0', 'important');
        this.container.style.setProperty('right', '0', 'important');
        this.container.style.setProperty('width', '100%', 'important');
        this.container.style.setProperty('max-width', '100%', 'important');
        this.container.style.setProperty('padding', '12px', 'important');
        this.container.style.setProperty('transform', 'none', 'important');
        this.container.style.gap = '12px';
        this.container.style.alignItems = 'stretch';
      } else {
        // Remove mobile-specific inline styles on desktop to let CSS handle it
        this.container.style.removeProperty('bottom');
        this.container.style.removeProperty('top');
        this.container.style.removeProperty('left');
        this.container.style.removeProperty('right');
        this.container.style.removeProperty('width');
        this.container.style.removeProperty('max-width');
        this.container.style.removeProperty('padding');
        this.container.style.removeProperty('transform');
        this.container.style.gap = '';
        this.container.style.alignItems = '';
      }
    }
  }

  private generateId(): string {
    return `toast-${Date.now()}-${++this.toastIdCounter}`;
  }

  private getIcon(type: ToastType): string {
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.333V8M8 10.667h.007M2 12l6-10 6 10H2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7.333V12M8 4h.007M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[type] || icons.info;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private show(options: ToastOptions): string {
    if (!this.container) {
      this.createContainer();
    }

    const id = this.generateId();
    const isMobile = window.innerWidth <= 640;
    
    const {
      type = 'info',
      title,
      message,
      duration = 3000,
      position = this.defaultPosition,
    } = options;

    // On mobile, always use bottom-center (full width, no start/center/end)
    const finalPosition = isMobile ? 'bottom-center' : position;
    
    // Update position
    this.updatePosition(finalPosition);

    // Get max toast count (1 for mobile, default for desktop)
    const maxToastCount = isMobile ? 1 : defaultSettings.maxToastCount;

    // Check if we've reached max toast count (before creating toast element)
    if (this.toasts.size >= maxToastCount) {
      // Add to queue
      this.toastQueue.push({ options, id });
      return id;
    }

    // Get icon color based on type
    const iconColorMap = {
      success: defaultSettings.iconSuccessColor,
      error: defaultSettings.iconErrorColor,
      warning: defaultSettings.iconWarningColor,
      info: defaultSettings.iconInfoColor
    };
    const iconColor = iconColorMap[type];

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.id = id;

    // Apply responsive width and styling
    if (isMobile) {
      toast.style.setProperty('width', '100%', 'important');
      toast.style.setProperty('min-width', '100%', 'important');
      toast.style.setProperty('max-width', '100%', 'important');
      toast.style.setProperty('border-radius', '8px', 'important');
      toast.style.setProperty('margin', '0', 'important');
    } else {
      // Desktop: use default width settings
      toast.style.width = `${defaultSettings.width}px`;
      toast.style.minWidth = `${defaultSettings.minWidth}px`;
      toast.style.maxWidth = `${defaultSettings.maxWidth}px`;
    }

    // Apply entrance animation (different for mobile - slide up from bottom)
    const entranceAnim = isMobile ? defaultSettings.mobileEntranceAnimation : defaultSettings.entranceAnimation;
    const animDuration = defaultSettings.animationDuration;
    const animEasing = defaultSettings.animationEasing;
    toast.style.animation = `${entranceAnim} ${animDuration}ms ${animEasing}`;

    // Store exit animation (different for mobile - slide down to bottom)
    const exitAnim = isMobile ? defaultSettings.mobileExitAnimation : defaultSettings.exitAnimation;
    toast.dataset.exitAnimation = exitAnim;
    toast.dataset.animDuration = String(animDuration);
    toast.dataset.animEasing = animEasing;

    // Build toast HTML - only show message (no title)
    let html = '';
    
    if (defaultSettings.showIcon) {
      html += `<div class="toast-icon" style="background: ${iconColor}; color: white;">${this.getIcon(type)}</div>`;
    }
    
    // Show only the message (use message if provided, otherwise use title as fallback)
    const displayMessage = message || title || '';
    html += `<div class="toast-content">`;
    html += `<div class="toast-message" style="font-size: ${defaultSettings.messageSize}px; font-weight: ${defaultSettings.messageWeight}; color: ${defaultSettings.messageColor};">${this.escapeHtml(displayMessage)}</div>`;
    html += `</div>`;
    
    if (defaultSettings.showClose) {
      html += `<button class="toast-close" onclick="window.customToastInstance.dismiss('${id}')">×</button>`;
    }
    
    toast.innerHTML = html;

    // Append to container
    this.container!.appendChild(toast);
    this.toasts.set(id, { element: toast, duration, timeoutId: null });

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.toasts.get(id)!.timeoutId = timeoutId;
    }

    return id;
  }

  private processQueue() {
    const isMobile = window.innerWidth <= 640;
    const maxCount = isMobile ? 1 : defaultSettings.maxToastCount;
    while (this.toasts.size < maxCount && this.toastQueue.length > 0) {
      const queued = this.toastQueue.shift();
      if (queued) {
        // Show the queued toast
        const { options, id } = queued;
        this.showQueuedToast(options, id);
      }
    }
  }

  private showQueuedToast(options: ToastOptions, id: string) {
    if (!this.container) {
      this.createContainer();
    }

    const isMobile = window.innerWidth <= 640;
    
    const {
      type = 'info',
      title,
      message,
      duration = 3000,
      position = this.defaultPosition,
    } = options;

    // On mobile, always use bottom-center (full width, no start/center/end)
    const finalPosition = isMobile ? 'bottom-center' : position;
    
    // Update position
    this.updatePosition(finalPosition);

    // Get icon color based on type
    const iconColorMap = {
      success: defaultSettings.iconSuccessColor,
      error: defaultSettings.iconErrorColor,
      warning: defaultSettings.iconWarningColor,
      info: defaultSettings.iconInfoColor
    };
    const iconColor = iconColorMap[type];

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.id = id;

    // Apply responsive width and styling
    if (isMobile) {
      toast.style.setProperty('width', '100%', 'important');
      toast.style.setProperty('min-width', '100%', 'important');
      toast.style.setProperty('max-width', '100%', 'important');
      toast.style.setProperty('border-radius', '8px', 'important');
      toast.style.setProperty('margin', '0', 'important');
    } else {
      // Desktop: use default width settings
      toast.style.width = `${defaultSettings.width}px`;
      toast.style.minWidth = `${defaultSettings.minWidth}px`;
      toast.style.maxWidth = `${defaultSettings.maxWidth}px`;
    }

    // Apply entrance animation (different for mobile - slide up from bottom)
    const entranceAnim = isMobile ? defaultSettings.mobileEntranceAnimation : defaultSettings.entranceAnimation;
    const animDuration = defaultSettings.animationDuration;
    const animEasing = defaultSettings.animationEasing;
    toast.style.animation = `${entranceAnim} ${animDuration}ms ${animEasing}`;

    // Store exit animation (different for mobile - slide down to bottom)
    const exitAnim = isMobile ? defaultSettings.mobileExitAnimation : defaultSettings.exitAnimation;
    toast.dataset.exitAnimation = exitAnim;
    toast.dataset.animDuration = String(animDuration);
    toast.dataset.animEasing = animEasing;

    // Build toast HTML - only show message (no title)
    let html = '';
    
    if (defaultSettings.showIcon) {
      html += `<div class="toast-icon" style="background: ${iconColor}; color: white;">${this.getIcon(type)}</div>`;
    }
    
    // Show only the message (use message if provided, otherwise use title as fallback)
    const displayMessage = message || title || '';
    html += `<div class="toast-content">`;
    html += `<div class="toast-message" style="font-size: ${defaultSettings.messageSize}px; font-weight: ${defaultSettings.messageWeight}; color: ${defaultSettings.messageColor};">${this.escapeHtml(displayMessage)}</div>`;
    html += `</div>`;
    
    if (defaultSettings.showClose) {
      html += `<button class="toast-close" onclick="window.customToastInstance.dismiss('${id}')">×</button>`;
    }
    
    toast.innerHTML = html;

    // Append to container
    this.container!.appendChild(toast);
    this.toasts.set(id, { element: toast, duration, timeoutId: null });

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.toasts.get(id)!.timeoutId = timeoutId;
    }
  }

  private dismiss(id: string) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    if (toastData.timeoutId) {
      clearTimeout(toastData.timeoutId);
    }

    // Get exit animation
    const exitAnim = toastData.element.dataset.exitAnimation || defaultSettings.exitAnimation;
    const animDuration = parseInt(toastData.element.dataset.animDuration || String(defaultSettings.animationDuration));
    const animEasing = toastData.element.dataset.animEasing || defaultSettings.animationEasing;

    // Apply exit animation
    toastData.element.style.animation = `${exitAnim} ${animDuration}ms ${animEasing} forwards`;

    // Remove after animation
    setTimeout(() => {
      toastData.element.remove();
      this.toasts.delete(id);
      // Process queue when a toast is dismissed
      this.processQueue();
    }, animDuration);
  }

  // Public methods
  success(message: string, options?: Omit<ToastOptions, 'type' | 'message'>): string {
    return this.show({ ...options, type: 'success', message });
  }

  error(message: string, options?: Omit<ToastOptions, 'type' | 'message'>): string {
    return this.show({ ...options, type: 'error', message });
  }

  warning(message: string, options?: Omit<ToastOptions, 'type' | 'message'>): string {
    return this.show({ ...options, type: 'warning', message });
  }

  info(message: string, options?: Omit<ToastOptions, 'type' | 'message'>): string {
    return this.show({ ...options, type: 'info', message });
  }

  showToast(options: ToastOptions): string {
    return this.show(options);
  }

  dismissToast(id: string): void {
    this.dismiss(id);
  }

  setDefaultPosition(position: ToastPosition): void {
    this.updatePosition(position);
  }
}

// Create singleton instance
export const customToast = new CustomToast();

// Make it accessible globally for onclick handlers
if (typeof window !== 'undefined') {
  (window as any).customToastInstance = customToast;
}

// Export convenience functions
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) =>
    customToast.success(message, options),
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) =>
    customToast.error(message, options),
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) =>
    customToast.warning(message, options),
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) =>
    customToast.info(message, options),
  show: (options: ToastOptions) => customToast.showToast(options),
  dismiss: (id: string) => customToast.dismissToast(id),
  setPosition: (position: ToastPosition) => customToast.setDefaultPosition(position),
};

export default toast;
