import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() active = false;
  
  currentPerspective = 'noob';
  newMessage = '';
  messages = [
    { sender: 'Anonymous #TX4K9', time: new Date(), text: 'Notice how all mainstream outlets are reporting the same narrative about Ukraine? Missing key context about the Minsk agreements.' },
    { sender: 'Anonymous #9B2F1', time: new Date(Date.now() - 17*60000), text: 'Check the satellite imagery from Maxar - shows significant movement near the Belarus border. Something big coming?' },
    { sender: 'Anonymous #7H3D8', time: new Date(Date.now() - 34*60000), text: 'Heard from contacts in Kyiv that air defenses were active all night. Not seeing this reported anywhere.' },
    { sender: 'Anonymous #L5P2E', time: new Date(Date.now() - 52*60000), text: 'Anyone else tracking the pipeline negotiations? Seems like a key development is being suppressed.' }
  ];

  setPerspective(perspective: string) {
    this.currentPerspective = perspective;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      const randomId = '#' + Math.random().toString(36).substring(2, 7).toUpperCase();
      this.messages.unshift({
        sender: `Anonymous ${randomId}`,
        time: new Date(),
        text: this.newMessage
      });
      this.newMessage = '';
    }
  }
}