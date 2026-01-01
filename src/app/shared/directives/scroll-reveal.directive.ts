import { Directive, ElementRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay: number = 0;
  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    // Add initial hidden state
    this.el.nativeElement.style.opacity = '0';
    this.el.nativeElement.style.transform = 'translateY(30px)';
    this.el.nativeElement.style.transition = `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${this.revealDelay}ms, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${this.revealDelay}ms`;

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is in viewport, reveal it
            this.el.nativeElement.style.opacity = '1';
            this.el.nativeElement.style.transform = 'translateY(0)';

            // Unobserve after revealing (one-time animation)
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
      }
    );

    // Start observing
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
