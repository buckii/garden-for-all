<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core'

const dashboardStore = useDashboardStore()

// Modal state
const showModal = ref(false)
const selectedEvent = ref<any>(null)

// FullCalendar configuration
const calendarOptions = ref<CalendarOptions>({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  firstDay: 1, // Start week on Monday (0 = Sunday, 1 = Monday)
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth'
  },
  height: 'auto',
  events: [],
  eventClick: (info: EventClickArg) => {
    // Show modal with event details
    selectedEvent.value = {
      pantryName: info.event.extendedProps.pantryName,
      committed: info.event.extendedProps.committed,
      delivered: info.event.extendedProps.delivered,
      percentage: info.event.extendedProps.percentage,
      remaining: info.event.extendedProps.remaining,
      date: info.event.start
    }
    showModal.value = true
  },
  eventContent: (arg) => {
    return {
      html: `<div class="fc-event-main-frame">
        <div class="fc-event-title-container">
          <div class="fc-event-title fc-sticky">${arg.event.title}</div>
        </div>
      </div>`
    }
  }
})

const closeModal = () => {
  showModal.value = false
  selectedEvent.value = null
}

const formatDate = (date: Date | null) => {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Transform commitment data into calendar events
const calendarEvents = computed((): EventInput[] => {
  if (!dashboardStore.commitmentData) return []

  const events: EventInput[] = []
  const data = dashboardStore.commitmentData
  const pantries = data.pantries || []
  const thisWeekCommitments = data.thisWeek.commitments || []
  const lastWeekCommitments = data.lastWeek.commitments || []
  const thisWeekEntries = data.thisWeek.harvest || []
  const lastWeekEntries = data.lastWeek.harvest || []

  // Helper function to get week dates
  const getWeekDates = (weekStart: string) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  // Process this week's commitments
  const thisWeekDates = getWeekDates(data.thisWeek.weekStart)
  const thisWeekByPantry = new Map<string, { commitments: any[], delivered: number, pantryName: string }>()

  thisWeekCommitments.forEach((commitment: any) => {
    const pantryId = commitment.pantryId?._id || commitment.pantryId
    const pantryName = commitment.pantryId?.name || pantries.find((p: any) => (p._id || p.id) === pantryId)?.name || 'Unknown Pantry'

    if (!thisWeekByPantry.has(pantryId)) {
      thisWeekByPantry.set(pantryId, { commitments: [], delivered: 0, pantryName })
    }

    thisWeekByPantry.get(pantryId)!.commitments.push(commitment)
  })

  // Calculate this week's deliveries by pantry
  thisWeekEntries.forEach((entry: any) => {
    const pantryId = entry.pantryId?._id || entry.pantryId || entry.pantry_id
    if (!pantryId) return

    const weight = entry.weight || 0

    if (thisWeekByPantry.has(pantryId)) {
      thisWeekByPantry.get(pantryId)!.delivered += weight
    }
  })

  // Create daily events for this week based on daysOfWeek
  thisWeekByPantry.forEach((data, pantryId) => {
    // Group commitments by days of week
    const dayCommitments = new Map<number, number>() // day -> total daily commitment

    data.commitments.forEach((commitment: any) => {
      const daysOfWeek = commitment.daysOfWeek || []
      const dailyWeight = commitment.dailyWeightLbs || 0

      daysOfWeek.forEach((day: number) => {
        dayCommitments.set(day, (dayCommitments.get(day) || 0) + dailyWeight)
      })
    })

    // Calculate delivery per day (distribute evenly for now)
    const daysWithCommitments = Array.from(dayCommitments.keys())
    const deliveryPerDay = daysWithCommitments.length > 0 ? data.delivered / daysWithCommitments.length : 0

    // Create an event for each committed day in this week
    dayCommitments.forEach((committedWeight, dayOfWeek) => {
      // Calculate the date for this day of week
      const eventDate = new Date(thisWeekDates.start)
      const currentDay = eventDate.getDay()
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7
      eventDate.setDate(eventDate.getDate() + daysToAdd)

      const percentage = committedWeight > 0 ? Math.round((deliveryPerDay / committedWeight) * 100) : 0
      const remaining = Math.max(0, committedWeight - deliveryPerDay)

      events.push({
        title: `${data.pantryName} (${Math.round(deliveryPerDay)}/${committedWeight}lbs)`,
        start: eventDate.toISOString().split('T')[0],
        allDay: true,
        backgroundColor: percentage >= 100 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
        borderColor: percentage >= 100 ? '#059669' : percentage >= 50 ? '#d97706' : '#dc2626',
        extendedProps: {
          pantryName: data.pantryName,
          pantryId,
          committed: committedWeight,
          delivered: deliveryPerDay,
          remaining: remaining,
          percentage
        }
      })
    })
  })

  // Process last week's commitments
  const lastWeekDates = getWeekDates(data.lastWeek.weekStart)
  const lastWeekByPantry = new Map<string, { commitments: any[], delivered: number, pantryName: string }>()

  lastWeekCommitments.forEach((commitment: any) => {
    const pantryId = commitment.pantryId?._id || commitment.pantryId
    const pantryName = commitment.pantryId?.name || pantries.find((p: any) => (p._id || p.id) === pantryId)?.name || 'Unknown Pantry'

    if (!lastWeekByPantry.has(pantryId)) {
      lastWeekByPantry.set(pantryId, { commitments: [], delivered: 0, pantryName })
    }

    lastWeekByPantry.get(pantryId)!.commitments.push(commitment)
  })

  // Calculate last week's deliveries by pantry
  lastWeekEntries.forEach((entry: any) => {
    const pantryId = entry.pantryId?._id || entry.pantryId || entry.pantry_id
    if (!pantryId) return

    const weight = entry.weight || 0

    if (lastWeekByPantry.has(pantryId)) {
      lastWeekByPantry.get(pantryId)!.delivered += weight
    }
  })

  // Create daily events for last week based on daysOfWeek
  lastWeekByPantry.forEach((data, pantryId) => {
    // Group commitments by days of week
    const dayCommitments = new Map<number, number>() // day -> total daily commitment

    data.commitments.forEach((commitment: any) => {
      const daysOfWeek = commitment.daysOfWeek || []
      const dailyWeight = commitment.dailyWeightLbs || 0

      daysOfWeek.forEach((day: number) => {
        dayCommitments.set(day, (dayCommitments.get(day) || 0) + dailyWeight)
      })
    })

    // Calculate delivery per day (distribute evenly for now)
    const daysWithCommitments = Array.from(dayCommitments.keys())
    const deliveryPerDay = daysWithCommitments.length > 0 ? data.delivered / daysWithCommitments.length : 0

    // Create an event for each committed day in last week
    dayCommitments.forEach((committedWeight, dayOfWeek) => {
      // Calculate the date for this day of week
      const eventDate = new Date(lastWeekDates.start)
      const currentDay = eventDate.getDay()
      const daysToAdd = (dayOfWeek - currentDay + 7) % 7
      eventDate.setDate(eventDate.getDate() + daysToAdd)

      const percentage = committedWeight > 0 ? Math.round((deliveryPerDay / committedWeight) * 100) : 0
      const remaining = Math.max(0, committedWeight - deliveryPerDay)

      events.push({
        title: `${data.pantryName} (${Math.round(deliveryPerDay)}/${committedWeight}lbs)`,
        start: eventDate.toISOString().split('T')[0],
        allDay: true,
        backgroundColor: percentage >= 100 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
        borderColor: percentage >= 100 ? '#059669' : percentage >= 50 ? '#d97706' : '#dc2626',
        extendedProps: {
          pantryName: data.pantryName,
          pantryId,
          committed: committedWeight,
          delivered: deliveryPerDay,
          remaining: remaining,
          percentage
        }
      })
    })
  })

  return events
})

// Update calendar events when data changes
watch(calendarEvents, (newEvents) => {
  if (calendarOptions.value) {
    calendarOptions.value.events = newEvents
  }
})

// Load data on mount
onMounted(async () => {
  await dashboardStore.fetchCommitments()
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-semibold text-gray-900 font-poppins">Delivery Plans Calendar</h3>
    </div>

    <div v-if="dashboardStore.loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-garden-green-600"></div>
      <p class="mt-2 text-gray-600">Loading commitments...</p>
    </div>

    <div v-else-if="dashboardStore.error" class="text-center py-8">
      <p class="text-red-600">Error loading commitments: {{ dashboardStore.error }}</p>
    </div>

    <div v-else>
      <div class="mb-4 flex gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #10b981;"></div>
          <span class="text-gray-600">100%+ Complete</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #f59e0b;"></div>
          <span class="text-gray-600">50-99% Complete</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: #ef4444;"></div>
          <span class="text-gray-600">&lt;50% Complete</span>
        </div>
      </div>

      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click="closeModal">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" @click.stop>
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {{ selectedEvent?.pantryName }}
                </h3>
                <div class="mt-2 space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Date:</span>
                    <span class="text-sm font-medium text-gray-900">{{ formatDate(selectedEvent?.date) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Committed:</span>
                    <span class="text-sm font-medium text-gray-900">{{ selectedEvent?.committed.toLocaleString() }} lbs</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Delivered:</span>
                    <span class="text-sm font-medium text-gray-900">{{ Math.round(selectedEvent?.delivered || 0).toLocaleString() }} lbs</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Progress:</span>
                    <span class="text-sm font-medium" :class="{
                      'text-green-600': selectedEvent?.percentage >= 100,
                      'text-yellow-600': selectedEvent?.percentage >= 50 && selectedEvent?.percentage < 100,
                      'text-red-600': selectedEvent?.percentage < 50
                    }">{{ selectedEvent?.percentage }}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Remaining:</span>
                    <span class="text-sm font-medium text-gray-900">{{ Math.round(selectedEvent?.remaining || 0).toLocaleString() }} lbs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" @click="closeModal"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-garden-green-600 text-base font-medium text-white hover:bg-garden-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garden-green-500 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* FullCalendar custom styles */
.fc {
  font-family: inherit;
}

.fc-event {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.875rem;
}

.fc-daygrid-event {
  white-space: normal;
}

.fc-event-title {
  font-weight: 500;
}

.fc .fc-button-primary {
  background-color: #16a34a;
  border-color: #16a34a;
}

.fc .fc-button-primary:hover {
  background-color: #15803d;
  border-color: #15803d;
}

.fc .fc-button-primary:not(:disabled):active,
.fc .fc-button-primary:not(:disabled).fc-button-active {
  background-color: #166534;
  border-color: #166534;
}

.fc-theme-standard td,
.fc-theme-standard th {
  border-color: #e5e7eb;
}

.fc .fc-toolbar-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}
</style>
