import { RouteMeta } from '@analogjs/router'
import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'

export const routeMeta: RouteMeta = {
  title: `100 Things To Do Before I Leave This Earth | Dale Nguyen`,
  meta: [{ name: 'description', content: 'My personal bucket list of experiences, adventures, and achievements' }],
}

interface BucketListItem {
  id: number
  text: string
  completed: boolean
  link?: string
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <header class="text-center mb-12">
        <h1 class="text-4xl font-extrabold text-gray-900 mb-3">100 Things To Do Before I Leave This Earth</h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          My personal bucket list of experiences, adventures, and achievements
        </p>
      </header>

      <div class="max-w-5xl mx-auto">
        <div class="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
          <div class="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold text-white">My Bucket List</h2>
              <div class="text-white">
                <span class="font-medium">{{ completedCount() }}</span> of
                <span class="font-medium">{{ totalCount() }}</span> completed
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                *ngFor="let item of sortedBucketListItems(); let i = index"
                class="transform transition-all duration-300 hover:scale-105"
              >
                <div
                  class="border rounded-lg overflow-hidden shadow-sm h-full flex flex-col"
                  [ngClass]="{
                    'bg-green-50 border-green-200': item.completed,
                    'bg-white border-gray-200': !item.completed
                  }"
                >
                  <div class="p-4 flex items-start gap-3 flex-grow">
                    <div class="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        [id]="'item-' + i"
                        [checked]="item.completed"
                        (change)="toggleComplete(item)"
                        class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <label
                      [for]="'item-' + i"
                      class="cursor-pointer flex-grow"
                      [ngClass]="{ 'line-through text-gray-500': item.completed, 'text-gray-800': !item.completed }"
                    >
                      <div class="font-medium mb-1">
                        <span class="mr-1">{{ i + 1 }}.</span>
                        <a
                          *ngIf="item.link"
                          [href]="item.link"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="hover:text-blue-600 hover:underline inline items-center"
                          (click)="$event.stopPropagation()"
                        >
                          {{ item.text }}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 ml-1 inline"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                        <span *ngIf="!item.link">{{ item.text }}</span>
                      </div>
                    </label>
                  </div>
                  <div *ngIf="item.completed" class="bg-green-100 px-4 py-2 text-green-800 text-sm font-medium">
                    Completed! 🎉
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class BucketListComponent implements OnInit {
  bucketListItems = signal<BucketListItem[]>([])

  sortedBucketListItems = computed(() => {
    return [...this.bucketListItems()].sort((a, b) => {
      // Sort by completion status (completed first)
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1
      }
      // Then sort by ID
      return a.id - b.id
    })
  })

  completedCount = computed(() => {
    return this.bucketListItems().filter((item) => item.completed).length
  })

  totalCount = computed(() => {
    return this.bucketListItems().length
  })

  ngOnInit(): void {
    // Initialize with sample bucket list items
    this.bucketListItems.set([
      {
        id: 1,
        text: 'Visit all 7 continents',
        completed: false,
      },
      { id: 2, text: 'Learn to play a musical instrument', completed: false },
      {
        id: 3,
        text: 'Run a marathon',
        completed: false,
      },
      { id: 4, text: 'Write a book', completed: true, link: 'https://www.amazon.com/gp/product/B000F2J37U' },
      { id: 5, text: 'Learn a new language', completed: true },
      { id: 6, text: 'Go skydiving', completed: false },
      { id: 7, text: 'Start an online business', completed: true, link: 'https://techcater.com/' },
      {
        id: 8,
        text: 'See the Northern Lights',
        completed: false,
      },
      { id: 9, text: 'Climb a mountain', completed: true },
      { id: 10, text: 'Learn to cook PHO', completed: false },
      { id: 11, text: 'Go on a hot air balloon ride', completed: false },
      { id: 12, text: 'Plant a tree and watch it grow', completed: false },
      { id: 13, text: 'Swim with dolphins', completed: true },
      { id: 14, text: 'Take a road trip across the country', completed: false },
      { id: 15, text: 'Learn to dance', completed: false },
      {
        id: 16,
        text: 'Go on a safari',
        completed: true,
        link: 'https://vinwonders.com/en/vinpearl-safari-phu-quoc/',
      },
      {
        id: 17,
        text: 'Visit the Great Wall of China',
        completed: false,
      },
      { id: 18, text: 'See the Pyramids of Egypt', completed: false },
      { id: 19, text: 'Learn to meditate', completed: true },
      { id: 20, text: 'Go scuba diving in the Great Barrier Reef', completed: false },
      { id: 21, text: 'Attend a major sporting event', completed: true },
      { id: 22, text: 'Learn to sail', completed: false },
      { id: 23, text: 'Visit the Grand Canyon', completed: false },
      { id: 24, text: 'Go on a cruise', completed: false },
      { id: 25, text: 'Learn photography', completed: true },
      { id: 26, text: 'Working abroad', completed: true },
      { id: 27, text: 'Go wine tasting in Napa Valley', completed: false },
      { id: 28, text: 'See a Broadway show in New York', completed: false, link: 'https://www.broadway.com/' },
      { id: 29, text: 'Ride a gondola in Venice', completed: false },
      { id: 30, text: 'Learn to surf', completed: false },
      { id: 31, text: 'Go on a helicopter ride', completed: false },
      { id: 32, text: 'Visit the Taj Mahal', completed: false, link: 'https://whc.unesco.org/en/list/252/' },
      { id: 33, text: 'Go white water rafting', completed: false },
      { id: 34, text: 'Learn to paint', completed: true },
      { id: 35, text: 'Go horseback riding on a beach', completed: false },
      { id: 36, text: 'Visit Machu Picchu', completed: false, link: 'https://www.machupicchu.org/' },
      { id: 37, text: 'Go on a solo trip', completed: true },
      { id: 38, text: 'Learn to make pottery', completed: false },
      { id: 39, text: 'Go paragliding', completed: false },
      { id: 40, text: 'Visit the Louvre Museum', completed: false },
      { id: 41, text: 'Go camping in the wilderness', completed: true },
      { id: 42, text: 'Learn to code', completed: true },
      { id: 43, text: 'Go snorkeling in a coral reef', completed: true },
      { id: 44, text: 'Visit Stonehenge', completed: false },
      { id: 45, text: 'Learn to make sushi', completed: false },
      { id: 46, text: 'Go on a hot spring bath in Iceland', completed: false },
      { id: 47, text: 'Visit the Amazon Rainforest', completed: false },
      { id: 48, text: 'Learn archery', completed: true },
      { id: 49, text: 'Go whale watching', completed: false },
      { id: 50, text: 'Visit the Colosseum in Rome', completed: false },
      { id: 51, text: 'Learn to make bread from scratch', completed: false },
      { id: 52, text: 'Go ice fishing on a natural lake', completed: true },
      { id: 53, text: 'Visit the Serengeti', completed: false },
      { id: 54, text: 'Learn to play chess', completed: true },
      { id: 55, text: 'Go kayaking', completed: true },
      { id: 56, text: 'Visit the Dead Sea', completed: false },
      { id: 57, text: 'Learn calligraphy', completed: false },
      { id: 58, text: 'Go stargazing in a desert', completed: false },
      { id: 59, text: 'Visit the Great Barrier Reef', completed: false },
      { id: 60, text: 'Learn to make cocktails', completed: false },
      { id: 61, text: 'Go on a wine tour in France', completed: false },
      { id: 62, text: 'Visit Petra in Jordan', completed: false, link: 'https://www.visitpetra.jo/' },
      { id: 63, text: 'Learn to ski or snowboard', completed: false },
      { id: 64, text: 'Go on a food tour in a foreign country', completed: false },
      { id: 65, text: 'Visit the Galapagos Islands', completed: false },
      { id: 66, text: 'Learn to knit or crochet', completed: false },
      { id: 67, text: 'Go ziplining through a forest', completed: false },
      { id: 68, text: 'Visit Angkor Wat in Cambodia', completed: false },
      { id: 69, text: 'Learn to make cheese', completed: false },
      { id: 70, text: 'Go on a bike tour through a wine country', completed: false },
      { id: 71, text: 'Visit the Acropolis in Athens', completed: false },
      { id: 72, text: 'Learn to play poker', completed: true },
      { id: 73, text: 'Go on a multi-day hike', completed: false },
      { id: 74, text: 'Road trip across Vietnam', completed: false },
      { id: 75, text: 'Learn to make chocolate from scratch', completed: false },
      { id: 76, text: 'Go sandboarding in a desert', completed: false },
      { id: 77, text: 'Visit the Blue Lagoon in Iceland', completed: false, link: 'https://www.bluelagoon.com/' },
      { id: 78, text: 'Learn to make pasta from scratch', completed: false },
      { id: 79, text: 'Go on a safari in Africa', completed: false },
      {
        id: 80,
        text: 'Visit the Sagrada Familia in Barcelona',
        completed: false,
        link: 'https://sagradafamilia.org/en/',
      },
      { id: 81, text: 'Learn to juggle', completed: false },
      { id: 82, text: 'Go on a hot air balloon ride over Cappadocia', completed: false },
      { id: 83, text: 'Visit the Forbidden City in Beijing', completed: false },
      { id: 84, text: 'Learn to make ice cream from scratch', completed: false },
      { id: 85, text: 'Go on a cruise to Antarctica', completed: false, link: 'https://www.antarcticacruises.net/' },
      { id: 86, text: 'Visit the Sistine Chapel', completed: false },
      { id: 87, text: 'Learn to make beer or wine', completed: true },
      { id: 88, text: 'Go on a dog sledding adventure', completed: false },
      {
        id: 89,
        text: 'Visit the Maldives before they disappear',
        completed: false,
        link: 'https://visitmaldives.com/',
      },
      { id: 90, text: 'Learn to make candles', completed: false },
      { id: 91, text: 'Go on a train journey through the Swiss Alps', completed: false },
      { id: 92, text: 'Visit the ancient city of Petra', completed: false, link: 'https://www.visitpetra.jo/' },
      { id: 93, text: 'Learn to make soap', completed: false },
      { id: 94, text: 'Go on a camel ride in the desert', completed: false },
      { id: 95, text: 'Visit the Terracotta Army in China', completed: false },
      { id: 96, text: 'Learn to make jam', completed: false },
      { id: 97, text: 'Go on a sailing trip in the Mediterranean', completed: false },
      { id: 98, text: 'Visit the Parthenon in Athens', completed: false, link: 'https://www.theacropolismuseum.gr/en' },
      { id: 99, text: 'Learn to make a perfect cup of coffee', completed: false },
      {
        id: 100,
        text: 'Go on a pilgrimage on the Camino de Santiago',
        completed: false,
        link: 'https://www.caminodesantiago.gal/en',
      },
    ])
  }

  toggleComplete(item: BucketListItem): void {
    const items = this.bucketListItems()
    const updatedItems = items.map((i) => {
      if (i.id === item.id) {
        return { ...i, completed: !i.completed }
      }
      return i
    })
    this.bucketListItems.set(updatedItems)
  }
}
