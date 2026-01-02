import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogPost } from '../../../core/models/blog.model';

@Component({
  selector: 'gc-blog-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.scss'
})
export class BlogCardComponent {
  @Input() post!: BlogPost;
  @Input() featured = false;
  @Output() cardClick = new EventEmitter<BlogPost>();

  onClick(): void {
    this.cardClick.emit(this.post);
  }
}
