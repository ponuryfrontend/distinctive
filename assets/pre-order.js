/**
 *  @element pre-order-countdown
 *  Keeps the pre-order countdown ticking. The initial values are rendered by
 *  Liquid, so this only has to correct for page cache and count down from there.
 *  The timer stops while the tab is hidden and is re-synced when it comes back.
 */
if (!customElements.get('pre-order-countdown')) {
  class PreOrderCountdown extends HTMLElement {
    connectedCallback() {
      this.end = parseInt(this.dataset.end, 10) * 1000;
      this.fields = {
        days: this.querySelector('[data-pre-order-days]'),
        hours: this.querySelector('[data-pre-order-hours]'),
        minutes: this.querySelector('[data-pre-order-minutes]'),
        seconds: this.querySelector('[data-pre-order-seconds]')
      };

      if (!this.end || Number.isNaN(this.end)) return;

      this.onVisibilityChange = () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.tick();
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.tick();
    }

    disconnectedCallback() {
      this.stop();
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    stop() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }

    write(field, value) {
      const text = String(value).padStart(2, '0');
      // Only touch the DOM when the digits actually change.
      if (field && field.textContent !== text) field.textContent = text;
    }

    tick() {
      this.stop();

      const remaining = Math.max(0, Math.floor((this.end - Date.now()) / 1000));

      this.write(this.fields.days, Math.floor(remaining / 86400));
      this.write(this.fields.hours, Math.floor((remaining % 86400) / 3600));
      this.write(this.fields.minutes, Math.floor((remaining % 3600) / 60));
      this.write(this.fields.seconds, remaining % 60);

      if (remaining <= 0) {
        this.setAttribute('data-finished', '');
        this.dispatchEvent(new CustomEvent('pre-order:finished', { bubbles: true }));
        return;
      }

      // Line the next update up with the start of the next second.
      this.timer = setTimeout(() => this.tick(), 1000 - (Date.now() % 1000));
    }
  }

  customElements.define('pre-order-countdown', PreOrderCountdown);
}
