<script setup lang="ts">
import { cn } from '../../lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900',
        secondary: 'border-transparent bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        destructive: 'border-transparent bg-red-600 dark:bg-red-500 text-zinc-50',
        outline: 'border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
        success: 'border-transparent bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
        warning: 'border-transparent bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props {
  class?: string
  variant?: BadgeVariants['variant']
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant: props.variant }), props.class)">
    <slot />
  </div>
</template>
