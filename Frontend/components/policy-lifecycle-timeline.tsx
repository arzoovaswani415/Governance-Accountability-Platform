'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  File,
  Search,
  Edit,
  CheckCircle,
  Rocket,
  Megaphone,
} from 'lucide-react'

// Types
export interface TimelineEvent {
  year: number | string
  event: string
  status?: string
}

export interface PolicyLifecycleTimelineProps {
  events: TimelineEvent[]
  title?: string
  showProgressBar?: boolean
  variant?: 'vertical' | 'horizontal'
}

// Stage configuration with colors and icons
const stageConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  announced: { 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/15', 
    borderColor: 'border-blue-500/50',
    icon: Megaphone 
  },
  promise: { 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-500/15', 
    borderColor: 'border-blue-500/50',
    icon: FileText 
  },
  proposed: { 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-500/15', 
    borderColor: 'border-purple-500/50',
    icon: File 
  },
  review: { 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bgColor: 'bg-yellow-500/15', 
    borderColor: 'border-yellow-500/50',
    icon: Search 
  },
  amendment: { 
    color: 'text-orange-600 dark:text-orange-400', 
    bgColor: 'bg-orange-500/15', 
    borderColor: 'border-orange-500/50',
    icon: Edit 
  },
  passed: { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bgColor: 'bg-emerald-500/15', 
    borderColor: 'border-emerald-500/50',
    icon: CheckCircle 
  },
  implemented: { 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-500/15', 
    borderColor: 'border-red-500/50',
    icon: Rocket 
  },
}

// Get stage from event text
function getStageFromEvent(event: string, status?: string): string {
  const eventLower = event.toLowerCase()
  
  if (status) return status
  
  if (eventLower.includes('promise') || eventLower.includes('manifesto') || eventLower.includes('announced')) {
    return 'announced'
  }
  if (eventLower.includes('introduced') || eventLower.includes('drafted') || eventLower.includes('proposal')) {
    return 'proposed'
  }
  if (eventLower.includes('committee') || eventLower.includes('review') || eventLower.includes('discussion')) {
    return 'review'
  }
  if (eventLower.includes('amendment') || eventLower.includes('modified')) {
    return 'amendment'
  }
  if (eventLower.includes('passed') || eventLower.includes('approved') || eventLower.includes('assent')) {
    return 'passed'
  }
  if (eventLower.includes('implement') || eventLower.includes('launch') || eventLower.includes('operational') || eventLower.includes('began') || eventLower.includes('achieved')) {
    return 'implemented'
  }
  
  return 'review' // default
}

// Calculate progress percentage
function calculateProgress(events: TimelineEvent[]): number {
  const stageWeights: Record<string, number> = {
    announced: 10,
    promise: 10,
    proposed: 25,
    review: 40,
    amendment: 55,
    passed: 75,
    implemented: 100,
  }
  
  let maxProgress = 0
  events.forEach(event => {
    const stage = getStageFromEvent(event.event, event.status)
    const weight = stageWeights[stage] || 0
    if (weight > maxProgress) maxProgress = weight
  })
  
  return maxProgress
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

const horizontalItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Progress Bar Component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Policy Progress</span>
        <span className="text-sm font-medium text-muted-foreground">{progress}% Complete</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Promise</span>
        <span>Bill</span>
        <span>Review</span>
        <span>Passed</span>
        <span>Implemented</span>
      </div>
    </div>
  )
}

// Vertical Timeline Component
function VerticalTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <motion.div
      className="space-y-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {events.map((event, idx) => {
        const stage = getStageFromEvent(event.event, event.status)
        const config = stageConfig[stage] || stageConfig.review
        const Icon = config.icon

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-11 h-11 rounded-full flex items-center justify-center bg-card border-2 ${config.borderColor} transition-all duration-200 hover:scale-110 hover:shadow-lg`}
                whileHover={{ scale: 1.1 }}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </motion.div>
              {idx < events.length - 1 && (
                <motion.div 
                  className="w-0.5 h-14 bg-border mt-2"
                  initial={{ height: 0 }}
                  animate={{ height: 56 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                />
              )}
            </div>
            <Card 
              className={`flex-1 p-4 mb-2 bg-card border-l-4 ${config.borderColor.replace('border-', 'border-l-')} border-t border-r border-b border-border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`font-bold text-sm ${config.color}`}>{event.year}</p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">{event.event}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs capitalize ${config.color} ${config.borderColor}`}
                >
                  {stage}
                </Badge>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// Horizontal Timeline Component
function HorizontalTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="overflow-x-auto pb-4">
      <motion.div
        className="flex gap-4 min-w-max px-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {events.map((event, idx) => {
          const stage = getStageFromEvent(event.event, event.status)
          const config = stageConfig[stage] || stageConfig.review
          const Icon = config.icon

          return (
            <motion.div
              key={idx}
              variants={horizontalItemVariants}
              className="flex flex-col items-center"
            >
              {/* Year marker */}
              <div className={`text-sm font-bold mb-2 ${config.color}`}>
                {event.year}
              </div>
              
              {/* Icon node */}
              <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-card border-2 ${config.borderColor} transition-all duration-200 hover:scale-110 hover:shadow-lg z-10`}
                whileHover={{ scale: 1.15 }}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </motion.div>
              
              {/* Connector line */}
              {idx < events.length - 1 && (
                <div className="absolute w-16 h-0.5 bg-border top-1/2 left-full -translate-y-1/2 hidden" />
              )}
              
              {/* Event card */}
              <Card 
                className={`mt-3 p-3 w-48 bg-card border-t-4 ${config.borderColor.replace('border-', 'border-t-')} border-l border-r border-b border-border transition-all duration-200 hover:shadow-md hover:-translate-y-1`}
              >
                <p className="text-xs text-foreground leading-relaxed line-clamp-3">{event.event}</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs capitalize mt-2 ${config.color} ${config.borderColor}`}
                >
                  {stage}
                </Badge>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
      
      {/* Timeline connector line */}
      <div className="relative mt-[-140px] mx-8 hidden md:block">
        <div className="h-0.5 bg-border w-full" />
      </div>
    </div>
  )
}

// Main Component
export function PolicyLifecycleTimeline({ 
  events, 
  title = 'Policy Evolution Timeline',
  showProgressBar = true,
  variant = 'vertical'
}: PolicyLifecycleTimelineProps) {
  const progress = calculateProgress(events)

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="text-xl font-bold">{title}</h2>
      )}
      
      {showProgressBar && <ProgressBar progress={progress} />}
      
      {variant === 'horizontal' ? (
        <HorizontalTimeline events={events} />
      ) : (
        <VerticalTimeline events={events} />
      )}
    </div>
  )
}

// Compact Timeline for sidebar/cards
export function CompactTimeline({ events, maxEvents = 4 }: { events: TimelineEvent[], maxEvents?: number }) {
  const displayEvents = events.slice(0, maxEvents)
  
  return (
    <motion.div 
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {displayEvents.map((event, idx) => {
        const stage = getStageFromEvent(event.event, event.status)
        const config = stageConfig[stage] || stageConfig.review
        const Icon = config.icon

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className={`flex items-center gap-3 p-2 rounded-lg bg-card border-l-4 ${config.borderColor.replace('border-', 'border-l-')} border-t border-r border-b border-border transition-all duration-200 hover:shadow-sm`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-card border ${config.borderColor}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{event.event}</p>
              <p className={`text-xs ${config.color}`}>{event.year}</p>
            </div>
          </motion.div>
        )
      })}
      {events.length > maxEvents && (
        <p className="text-xs text-muted-foreground text-center">
          +{events.length - maxEvents} more events
        </p>
      )}
    </motion.div>
  )
}

// Stage Legend Component
export function TimelineLegend() {
  const stages = [
    { key: 'announced', label: 'Promise' },
    { key: 'proposed', label: 'Bill Introduced' },
    { key: 'review', label: 'Committee Review' },
    { key: 'amendment', label: 'Amendment' },
    { key: 'passed', label: 'Bill Passed' },
    { key: 'implemented', label: 'Implementation' },
  ]

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      {stages.map(stage => {
        const config = stageConfig[stage.key]
        const Icon = config.icon
        
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}>
              <Icon className={`w-3 h-3 ${config.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">{stage.label}</span>
          </div>
        )
      })}
    </div>
  )
}
